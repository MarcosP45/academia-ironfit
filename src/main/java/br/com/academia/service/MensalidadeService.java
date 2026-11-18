package br.com.academia.service;

import br.com.academia.dto.MensalidadeDTO;
import br.com.academia.exception.RecursoNaoEncontradoException;
import br.com.academia.exception.RegraNegocioException;
import br.com.academia.model.Aluno;
import br.com.academia.model.Mensalidade;
import br.com.academia.model.StatusMensalidade;
import br.com.academia.repository.AlunoRepository;
import br.com.academia.repository.MensalidadeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Service
public class MensalidadeService {

    private static final BigDecimal MULTA = new BigDecimal("0.02");
    private static final BigDecimal JUROS_DIA = new BigDecimal("0.01").divide(new BigDecimal("30"), 10, RoundingMode.HALF_UP);
    private static final DateTimeFormatter MES_ANO = DateTimeFormatter.ofPattern("MM/yyyy");

    private final MensalidadeRepository mensalidadeRepository;
    private final AlunoRepository alunoRepository;

    public MensalidadeService(MensalidadeRepository mensalidadeRepository, AlunoRepository alunoRepository) {
        this.mensalidadeRepository = mensalidadeRepository;
        this.alunoRepository = alunoRepository;
    }

    @Transactional(readOnly = true)
    public List<MensalidadeDTO.Response> listar(Long alunoId, String situacao) {
        List<Mensalidade> lista = alunoId != null
                ? mensalidadeRepository.findByAlunoIdOrderByDataVencimentoDesc(alunoId)
                : mensalidadeRepository.findAllByOrderByDataVencimentoDesc();
        return lista.stream()
                .filter(m -> situacao == null || situacao.isBlank() || m.getSituacao().equalsIgnoreCase(situacao))
                .map(this::paraResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public MensalidadeDTO.Response buscar(Long id) {
        return paraResponse(entidade(id));
    }

    @Transactional
    public MensalidadeDTO.Response criar(MensalidadeDTO.Request req) {
        Aluno aluno = aluno(req.alunoId());
        BigDecimal valor = req.valor();
        if (valor == null) {
            if (aluno.getPlano() == null) {
                throw new RegraNegocioException("O aluno não possui plano. Informe o valor da mensalidade.");
            }
            valor = aluno.getPlano().getValorMensal();
        }
        if (mensalidadeRepository.existsByAlunoIdAndDataVencimento(aluno.getId(), req.dataVencimento())) {
            throw new RegraNegocioException("Já existe uma mensalidade deste aluno com esse vencimento.");
        }
        Mensalidade m = new Mensalidade();
        m.setAluno(aluno);
        m.setValor(valor);
        m.setDataVencimento(req.dataVencimento());
        m.setDescricao(req.descricao() != null && !req.descricao().isBlank()
                ? req.descricao().trim()
                : descricaoPadrao(aluno, req.dataVencimento()));
        return paraResponse(mensalidadeRepository.save(m));
    }

    @Transactional
    public List<MensalidadeDTO.Response> gerar(MensalidadeDTO.GerarRequest req) {
        Aluno aluno = aluno(req.alunoId());
        if (!aluno.isAtivo()) {
            throw new RegraNegocioException("Não é possível gerar mensalidades para um aluno inativo.");
        }
        if (aluno.getPlano() == null) {
            throw new RegraNegocioException("O aluno não possui plano. Vincule um plano antes de gerar mensalidades.");
        }
        LocalDate primeiro = req.primeiroVencimento();
        if (primeiro == null) {
            primeiro = mensalidadeRepository.findFirstByAlunoIdOrderByDataVencimentoDesc(aluno.getId())
                    .map(ultima -> ultima.getDataVencimento().plusMonths(1))
                    .orElse(aluno.getDataMatricula());
        }
        List<Mensalidade> geradas = gerarParaAluno(aluno, req.quantidade(), primeiro);
        if (geradas.isEmpty()) {
            throw new RegraNegocioException("Nenhuma mensalidade gerada: os vencimentos informados já existem.");
        }
        return geradas.stream().map(this::paraResponse).toList();
    }

    @Transactional
    public List<Mensalidade> gerarParaAluno(Aluno aluno, int quantidade, LocalDate primeiroVencimento) {
        List<Mensalidade> geradas = new ArrayList<>();
        for (int i = 0; i < quantidade; i++) {
            LocalDate vencimento = primeiroVencimento.plusMonths(i);
            if (mensalidadeRepository.existsByAlunoIdAndDataVencimento(aluno.getId(), vencimento)) {
                continue;
            }
            Mensalidade m = new Mensalidade();
            m.setAluno(aluno);
            m.setValor(aluno.getPlano().getValorMensal());
            m.setDataVencimento(vencimento);
            m.setDescricao(descricaoPadrao(aluno, vencimento));
            geradas.add(mensalidadeRepository.save(m));
        }
        return geradas;
    }

    @Transactional
    public MensalidadeDTO.Response pagar(Long id, MensalidadeDTO.PagamentoRequest req) {
        Mensalidade m = entidade(id);
        if (m.getStatus() == StatusMensalidade.PAGA) {
            throw new RegraNegocioException("Esta mensalidade já foi paga em " + m.getDataPagamento() + ".");
        }
        if (m.getStatus() == StatusMensalidade.CANCELADA) {
            throw new RegraNegocioException("Não é possível pagar uma mensalidade cancelada.");
        }
        LocalDate data = req.dataPagamento() != null ? req.dataPagamento() : LocalDate.now();
        m.setValorPago(calcularValorAtualizado(m, data));
        m.setDataPagamento(data);
        m.setFormaPagamento(req.formaPagamento());
        m.setStatus(StatusMensalidade.PAGA);
        return paraResponse(m);
    }

    @Transactional
    public MensalidadeDTO.Response estornar(Long id) {
        Mensalidade m = entidade(id);
        if (m.getStatus() != StatusMensalidade.PAGA) {
            throw new RegraNegocioException("Somente mensalidades pagas podem ser estornadas.");
        }
        m.setStatus(StatusMensalidade.PENDENTE);
        m.setDataPagamento(null);
        m.setValorPago(null);
        m.setFormaPagamento(null);
        return paraResponse(m);
    }

    @Transactional
    public MensalidadeDTO.Response cancelar(Long id) {
        Mensalidade m = entidade(id);
        if (m.getStatus() != StatusMensalidade.PENDENTE) {
            throw new RegraNegocioException("Somente mensalidades pendentes podem ser canceladas.");
        }
        m.setStatus(StatusMensalidade.CANCELADA);
        return paraResponse(m);
    }

    @Transactional
    public void excluir(Long id) {
        Mensalidade m = entidade(id);
        if (m.getStatus() == StatusMensalidade.PAGA) {
            throw new RegraNegocioException("Mensalidades pagas não podem ser excluídas. Faça o estorno primeiro.");
        }
        mensalidadeRepository.delete(m);
    }

    public BigDecimal calcularValorAtualizado(Mensalidade m, LocalDate dataPagamento) {
        if (m.getStatus() != StatusMensalidade.PENDENTE || !dataPagamento.isAfter(m.getDataVencimento())) {
            return m.getValor();
        }
        long dias = ChronoUnit.DAYS.between(m.getDataVencimento(), dataPagamento);
        BigDecimal fator = BigDecimal.ONE.add(MULTA).add(JUROS_DIA.multiply(BigDecimal.valueOf(dias)));
        return m.getValor().multiply(fator).setScale(2, RoundingMode.HALF_UP);
    }

    public MensalidadeDTO.Response paraResponse(Mensalidade m) {
        BigDecimal atualizado = m.getStatus() == StatusMensalidade.PAGA
                ? m.getValorPago()
                : calcularValorAtualizado(m, LocalDate.now());
        return MensalidadeDTO.Response.de(m, atualizado);
    }

    public Mensalidade entidade(Long id) {
        return mensalidadeRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Mensalidade", id));
    }

    private Aluno aluno(Long id) {
        return alunoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Aluno", id));
    }

    private String descricaoPadrao(Aluno aluno, LocalDate vencimento) {
        String plano = aluno.getPlano() != null ? aluno.getPlano().getNome() : "Mensalidade";
        return plano + " - " + vencimento.format(MES_ANO);
    }
}
