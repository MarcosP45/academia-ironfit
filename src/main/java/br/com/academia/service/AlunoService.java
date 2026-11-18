package br.com.academia.service;

import br.com.academia.dto.AlunoDTO;
import br.com.academia.exception.RecursoNaoEncontradoException;
import br.com.academia.exception.RegraNegocioException;
import br.com.academia.model.Aluno;
import br.com.academia.model.Plano;
import br.com.academia.model.StatusMensalidade;
import br.com.academia.repository.AlunoRepository;
import br.com.academia.repository.AvaliacaoFisicaRepository;
import br.com.academia.repository.FichaTreinoRepository;
import br.com.academia.repository.MensalidadeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class AlunoService {

    private final AlunoRepository alunoRepository;
    private final MensalidadeRepository mensalidadeRepository;
    private final FichaTreinoRepository fichaRepository;
    private final AvaliacaoFisicaRepository avaliacaoRepository;
    private final PlanoService planoService;
    private final MensalidadeService mensalidadeService;

    public AlunoService(AlunoRepository alunoRepository,
                        MensalidadeRepository mensalidadeRepository,
                        FichaTreinoRepository fichaRepository,
                        AvaliacaoFisicaRepository avaliacaoRepository,
                        PlanoService planoService,
                        MensalidadeService mensalidadeService) {
        this.alunoRepository = alunoRepository;
        this.mensalidadeRepository = mensalidadeRepository;
        this.fichaRepository = fichaRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.planoService = planoService;
        this.mensalidadeService = mensalidadeService;
    }

    @Transactional(readOnly = true)
    public List<AlunoDTO.Response> listar(String busca, Boolean ativo) {
        String termo = busca == null ? "" : busca.trim();
        Set<Long> inadimplentes = idsInadimplentes();
        String digitos = termo.replaceAll("\\D", "");
        return alunoRepository.buscar(termo, digitos, ativo).stream()
                .map(a -> AlunoDTO.Response.de(a, inadimplentes.contains(a.getId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public AlunoDTO.Response buscar(Long id) {
        Aluno a = entidade(id);
        return AlunoDTO.Response.de(a, idsInadimplentes().contains(id));
    }

    @Transactional
    public AlunoDTO.Response criar(AlunoDTO.Request req) {
        String cpf = validarCpf(req.cpf());
        if (alunoRepository.existsByCpf(cpf)) {
            throw new RegraNegocioException("Já existe um aluno cadastrado com este CPF.");
        }
        Aluno aluno = new Aluno();
        preencher(aluno, req, cpf);
        if (aluno.getDataMatricula() == null) {
            aluno.setDataMatricula(LocalDate.now());
        }
        aluno = alunoRepository.save(aluno);

        if (aluno.getPlano() != null) {
            mensalidadeService.gerarParaAluno(aluno, aluno.getPlano().getDuracaoMeses(), aluno.getDataMatricula());
        }
        return AlunoDTO.Response.de(aluno, false);
    }

    @Transactional
    public AlunoDTO.Response atualizar(Long id, AlunoDTO.Request req) {
        Aluno aluno = entidade(id);
        String cpf = validarCpf(req.cpf());
        if (alunoRepository.existsByCpfAndIdNot(cpf, id)) {
            throw new RegraNegocioException("Já existe outro aluno cadastrado com este CPF.");
        }
        preencher(aluno, req, cpf);
        return AlunoDTO.Response.de(aluno, idsInadimplentes().contains(id));
    }

    @Transactional
    public AlunoDTO.Response alterarStatus(Long id, boolean ativo) {
        Aluno aluno = entidade(id);
        aluno.setAtivo(ativo);
        return AlunoDTO.Response.de(aluno, idsInadimplentes().contains(id));
    }

    @Transactional
    public void excluir(Long id) {
        Aluno aluno = entidade(id);
        avaliacaoRepository.deleteByAlunoId(id);
        fichaRepository.deleteAll(fichaRepository.findByAlunoId(id));
        mensalidadeRepository.deleteByAlunoId(id);
        alunoRepository.delete(aluno);
    }

    public Aluno entidade(Long id) {
        return alunoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Aluno", id));
    }

    public Aluno entidadeAtiva(Long id) {
        Aluno a = entidade(id);
        if (!a.isAtivo()) {
            throw new RegraNegocioException("O aluno " + a.getNome() + " está inativo.");
        }
        return a;
    }

    private Set<Long> idsInadimplentes() {
        return new HashSet<>(mensalidadeRepository.idsAlunosComStatusAntesDe(StatusMensalidade.PENDENTE, LocalDate.now()));
    }

    private String validarCpf(String cpf) {
        if (!CpfUtil.isValido(cpf)) {
            throw new RegraNegocioException("CPF inválido.");
        }
        return CpfUtil.somenteNumeros(cpf);
    }

    private void preencher(Aluno aluno, AlunoDTO.Request req, String cpf) {
        aluno.setNome(req.nome().trim());
        aluno.setCpf(cpf);
        aluno.setEmail(req.email());
        aluno.setTelefone(req.telefone());
        aluno.setDataNascimento(req.dataNascimento());
        if (req.dataMatricula() != null) {
            aluno.setDataMatricula(req.dataMatricula());
        }
        if (req.ativo() != null) {
            aluno.setAtivo(req.ativo());
        }
        if (req.planoId() == null) {
            aluno.setPlano(null);
        } else if (aluno.getPlano() == null || !aluno.getPlano().getId().equals(req.planoId())) {
            Plano plano = planoService.entidade(req.planoId());
            if (!plano.isAtivo()) {
                throw new RegraNegocioException("O plano \"" + plano.getNome() + "\" está inativo.");
            }
            aluno.setPlano(plano);
        }
    }
}
