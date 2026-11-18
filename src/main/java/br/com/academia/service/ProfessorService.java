package br.com.academia.service;

import br.com.academia.dto.ProfessorDTO;
import br.com.academia.exception.RecursoNaoEncontradoException;
import br.com.academia.exception.RegraNegocioException;
import br.com.academia.model.Professor;
import br.com.academia.repository.AvaliacaoFisicaRepository;
import br.com.academia.repository.FichaTreinoRepository;
import br.com.academia.repository.ProfessorRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProfessorService {

    private final ProfessorRepository professorRepository;
    private final FichaTreinoRepository fichaRepository;
    private final AvaliacaoFisicaRepository avaliacaoRepository;

    public ProfessorService(ProfessorRepository professorRepository,
                            FichaTreinoRepository fichaRepository,
                            AvaliacaoFisicaRepository avaliacaoRepository) {
        this.professorRepository = professorRepository;
        this.fichaRepository = fichaRepository;
        this.avaliacaoRepository = avaliacaoRepository;
    }

    @Transactional(readOnly = true)
    public List<ProfessorDTO.Response> listar(String busca) {
        String termo = busca == null ? "" : busca.trim();
        return professorRepository.buscar(termo).stream().map(ProfessorDTO.Response::de).toList();
    }

    @Transactional(readOnly = true)
    public ProfessorDTO.Response buscar(Long id) {
        return ProfessorDTO.Response.de(entidade(id));
    }

    @Transactional
    public ProfessorDTO.Response criar(ProfessorDTO.Request req) {
        String cpf = validarCpf(req.cpf());
        if (professorRepository.existsByCpf(cpf)) {
            throw new RegraNegocioException("Já existe um professor cadastrado com este CPF.");
        }
        if (professorRepository.existsByCrefIgnoreCase(req.cref().trim())) {
            throw new RegraNegocioException("Já existe um professor cadastrado com este CREF.");
        }
        Professor p = new Professor();
        preencher(p, req, cpf);
        return ProfessorDTO.Response.de(professorRepository.save(p));
    }

    @Transactional
    public ProfessorDTO.Response atualizar(Long id, ProfessorDTO.Request req) {
        Professor p = entidade(id);
        String cpf = validarCpf(req.cpf());
        if (professorRepository.existsByCpfAndIdNot(cpf, id)) {
            throw new RegraNegocioException("Já existe outro professor com este CPF.");
        }
        if (professorRepository.existsByCrefIgnoreCaseAndIdNot(req.cref().trim(), id)) {
            throw new RegraNegocioException("Já existe outro professor com este CREF.");
        }
        preencher(p, req, cpf);
        return ProfessorDTO.Response.de(p);
    }

    @Transactional
    public ProfessorDTO.Response alterarStatus(Long id, boolean ativo) {
        Professor p = entidade(id);
        p.setAtivo(ativo);
        return ProfessorDTO.Response.de(p);
    }

    @Transactional
    public void excluir(Long id) {
        Professor p = entidade(id);
        if (fichaRepository.existsByProfessorId(id) || avaliacaoRepository.existsByProfessorId(id)) {
            throw new RegraNegocioException("O professor " + p.getNome()
                    + " possui fichas de treino ou avaliações registradas. Inative-o em vez de excluir.");
        }
        professorRepository.delete(p);
    }

    public Professor entidade(Long id) {
        return professorRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Professor", id));
    }

    public Professor entidadeAtivaOuNulo(Long id) {
        if (id == null) return null;
        Professor p = entidade(id);
        if (!p.isAtivo()) {
            throw new RegraNegocioException("O professor " + p.getNome() + " está inativo.");
        }
        return p;
    }

    private String validarCpf(String cpf) {
        if (!CpfUtil.isValido(cpf)) {
            throw new RegraNegocioException("CPF inválido.");
        }
        return CpfUtil.somenteNumeros(cpf);
    }

    private void preencher(Professor p, ProfessorDTO.Request req, String cpf) {
        p.setNome(req.nome().trim());
        p.setCpf(cpf);
        p.setCref(req.cref().trim().toUpperCase());
        p.setEmail(req.email());
        p.setTelefone(req.telefone());
        p.setEspecialidade(req.especialidade());
        p.setDataAdmissao(req.dataAdmissao());
        if (req.ativo() != null) {
            p.setAtivo(req.ativo());
        }
    }
}
