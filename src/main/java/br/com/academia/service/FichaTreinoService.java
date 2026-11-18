package br.com.academia.service;

import br.com.academia.dto.FichaTreinoDTO;
import br.com.academia.exception.RecursoNaoEncontradoException;
import br.com.academia.exception.RegraNegocioException;
import br.com.academia.model.FichaTreino;
import br.com.academia.model.ItemTreino;
import br.com.academia.repository.FichaTreinoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class FichaTreinoService {

    private final FichaTreinoRepository fichaRepository;
    private final AlunoService alunoService;
    private final ProfessorService professorService;

    public FichaTreinoService(FichaTreinoRepository fichaRepository,
                              AlunoService alunoService,
                              ProfessorService professorService) {
        this.fichaRepository = fichaRepository;
        this.alunoService = alunoService;
        this.professorService = professorService;
    }

    @Transactional(readOnly = true)
    public List<FichaTreinoDTO.Response> listar(Long alunoId, Boolean apenasAtivas) {
        List<FichaTreino> fichas = alunoId != null
                ? fichaRepository.findByAlunoIdOrderByAtivaDescDataInicioDesc(alunoId)
                : fichaRepository.findAllByOrderByAtivaDescDataInicioDesc();
        return fichas.stream()
                .filter(f -> apenasAtivas == null || !apenasAtivas || f.isAtiva())
                .map(FichaTreinoDTO.Response::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public FichaTreinoDTO.Response buscar(Long id) {
        return FichaTreinoDTO.Response.de(entidade(id));
    }

    @Transactional
    public FichaTreinoDTO.Response criar(FichaTreinoDTO.Request req) {
        FichaTreino ficha = new FichaTreino();
        ficha.setAluno(alunoService.entidadeAtiva(req.alunoId()));
        preencher(ficha, req);
        return FichaTreinoDTO.Response.de(fichaRepository.save(ficha));
    }

    @Transactional
    public FichaTreinoDTO.Response atualizar(Long id, FichaTreinoDTO.Request req) {
        FichaTreino ficha = entidade(id);
        if (!ficha.getAluno().getId().equals(req.alunoId())) {
            ficha.setAluno(alunoService.entidadeAtiva(req.alunoId()));
        }
        preencher(ficha, req);
        return FichaTreinoDTO.Response.de(fichaRepository.saveAndFlush(ficha));
    }

    @Transactional
    public FichaTreinoDTO.Response alterarStatus(Long id, boolean ativa) {
        FichaTreino ficha = entidade(id);
        ficha.setAtiva(ativa);
        return FichaTreinoDTO.Response.de(ficha);
    }

    @Transactional
    public FichaTreinoDTO.Response duplicar(Long id) {
        FichaTreino original = entidade(id);
        FichaTreino copia = new FichaTreino();
        copia.setAluno(original.getAluno());
        copia.setProfessor(original.getProfessor());
        copia.setNome(original.getNome() + " (cópia)");
        copia.setObjetivo(original.getObjetivo());
        copia.setDataInicio(java.time.LocalDate.now());
        copia.setObservacoes(original.getObservacoes());
        copia.setAtiva(false);
        for (ItemTreino i : original.getItens()) {
            copia.adicionarItem(new ItemTreino(i.getOrdem(), i.getExercicio(), i.getGrupoMuscular(),
                    i.getSeries(), i.getRepeticoes(), i.getCarga(), i.getDescansoSegundos(), i.getObservacao()));
        }
        return FichaTreinoDTO.Response.de(fichaRepository.save(copia));
    }

    @Transactional
    public void excluir(Long id) {
        fichaRepository.delete(entidade(id));
    }

    public FichaTreino entidade(Long id) {
        return fichaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Ficha de treino", id));
    }

    private void preencher(FichaTreino ficha, FichaTreinoDTO.Request req) {
        if (req.dataFim() != null && req.dataFim().isBefore(req.dataInicio())) {
            throw new RegraNegocioException("A data de término deve ser posterior à data de início.");
        }
        Long professorAtual = ficha.getProfessor() != null ? ficha.getProfessor().getId() : null;
        if (req.professorId() == null) {
            ficha.setProfessor(null);
        } else if (!req.professorId().equals(professorAtual)) {
            ficha.setProfessor(professorService.entidadeAtivaOuNulo(req.professorId()));
        }
        ficha.setNome(req.nome().trim());
        ficha.setObjetivo(req.objetivo());
        ficha.setDataInicio(req.dataInicio());
        ficha.setDataFim(req.dataFim());
        ficha.setObservacoes(req.observacoes());
        if (req.ativa() != null) {
            ficha.setAtiva(req.ativa());
        }

        ficha.limparItens();
        int ordem = 1;
        for (FichaTreinoDTO.ItemRequest i : req.itens()) {
            ficha.adicionarItem(new ItemTreino(ordem++, i.exercicio().trim(), i.grupoMuscular(), i.series(),
                    i.repeticoes().trim(), i.carga(), i.descansoSegundos(), i.observacao()));
        }
    }
}
