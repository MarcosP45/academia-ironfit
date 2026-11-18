package br.com.academia.service;

import br.com.academia.dto.AvaliacaoFisicaDTO;
import br.com.academia.exception.RecursoNaoEncontradoException;
import br.com.academia.model.Aluno;
import br.com.academia.model.AvaliacaoFisica;
import br.com.academia.repository.AvaliacaoFisicaRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AvaliacaoFisicaService {

    private final AvaliacaoFisicaRepository avaliacaoRepository;
    private final AlunoService alunoService;
    private final ProfessorService professorService;

    public AvaliacaoFisicaService(AvaliacaoFisicaRepository avaliacaoRepository,
                                  AlunoService alunoService,
                                  ProfessorService professorService) {
        this.avaliacaoRepository = avaliacaoRepository;
        this.alunoService = alunoService;
        this.professorService = professorService;
    }

    @Transactional(readOnly = true)
    public List<AvaliacaoFisicaDTO.Response> listar(Long alunoId) {
        List<AvaliacaoFisica> lista = alunoId != null
                ? avaliacaoRepository.findByAlunoIdOrderByDataAvaliacaoDescIdDesc(alunoId)
                : avaliacaoRepository.findAllByOrderByDataAvaliacaoDescIdDesc();
        return lista.stream().map(AvaliacaoFisicaDTO.Response::de).toList();
    }

    @Transactional(readOnly = true)
    public AvaliacaoFisicaDTO.Response buscar(Long id) {
        return AvaliacaoFisicaDTO.Response.de(entidade(id));
    }

    @Transactional
    public AvaliacaoFisicaDTO.Response criar(AvaliacaoFisicaDTO.Request req) {
        AvaliacaoFisica a = new AvaliacaoFisica();
        a.setAluno(alunoService.entidadeAtiva(req.alunoId()));
        preencher(a, req);
        return AvaliacaoFisicaDTO.Response.de(avaliacaoRepository.save(a));
    }

    @Transactional
    public AvaliacaoFisicaDTO.Response atualizar(Long id, AvaliacaoFisicaDTO.Request req) {
        AvaliacaoFisica a = entidade(id);
        if (!a.getAluno().getId().equals(req.alunoId())) {
            a.setAluno(alunoService.entidadeAtiva(req.alunoId()));
        }
        preencher(a, req);
        return AvaliacaoFisicaDTO.Response.de(a);
    }

    @Transactional
    public void excluir(Long id) {
        avaliacaoRepository.delete(entidade(id));
    }

    @Transactional(readOnly = true)
    public AvaliacaoFisicaDTO.Evolucao evolucao(Long alunoId) {
        Aluno aluno = alunoService.entidade(alunoId);
        List<AvaliacaoFisicaDTO.Response> historico = avaliacaoRepository
                .findByAlunoIdOrderByDataAvaliacaoAscIdAsc(alunoId).stream()
                .map(AvaliacaoFisicaDTO.Response::de)
                .toList();

        if (historico.isEmpty()) {
            return new AvaliacaoFisicaDTO.Evolucao(aluno.getId(), aluno.getNome(), 0,
                    null, null, null, null, null, null, null, historico);
        }
        AvaliacaoFisicaDTO.Response primeira = historico.get(0);
        AvaliacaoFisicaDTO.Response ultima = historico.get(historico.size() - 1);
        return new AvaliacaoFisicaDTO.Evolucao(aluno.getId(), aluno.getNome(), historico.size(),
                primeira, ultima,
                diferenca(primeira.peso(), ultima.peso()),
                diferenca(primeira.imc(), ultima.imc()),
                diferenca(primeira.percentualGordura(), ultima.percentualGordura()),
                diferenca(primeira.massaMagra(), ultima.massaMagra()),
                diferenca(primeira.cintura(), ultima.cintura()),
                historico);
    }

    public AvaliacaoFisica entidade(Long id) {
        return avaliacaoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Avaliação física", id));
    }

    private static Double diferenca(Double antes, Double depois) {
        if (antes == null || depois == null) return null;
        return Math.round((depois - antes) * 10.0) / 10.0;
    }

    private void preencher(AvaliacaoFisica a, AvaliacaoFisicaDTO.Request req) {
        Long professorAtual = a.getProfessor() != null ? a.getProfessor().getId() : null;
        if (req.professorId() == null) {
            a.setProfessor(null);
        } else if (!req.professorId().equals(professorAtual)) {
            a.setProfessor(professorService.entidadeAtivaOuNulo(req.professorId()));
        }
        a.setDataAvaliacao(req.dataAvaliacao());
        a.setPeso(req.peso());
        a.setAltura(req.altura());
        a.setPercentualGordura(req.percentualGordura());
        a.setTorax(req.torax());
        a.setCintura(req.cintura());
        a.setAbdomen(req.abdomen());
        a.setQuadril(req.quadril());
        a.setBracoDireito(req.bracoDireito());
        a.setCoxaDireita(req.coxaDireita());
        a.setFrequenciaCardiacaRepouso(req.frequenciaCardiacaRepouso());
        a.setPressaoArterial(req.pressaoArterial() == null || req.pressaoArterial().isBlank()
                ? null : req.pressaoArterial().trim());
        a.setObservacoes(req.observacoes());
    }
}
