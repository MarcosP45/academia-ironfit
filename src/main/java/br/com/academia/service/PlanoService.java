package br.com.academia.service;

import br.com.academia.dto.PlanoDTO;
import br.com.academia.exception.RecursoNaoEncontradoException;
import br.com.academia.exception.RegraNegocioException;
import br.com.academia.model.Plano;
import br.com.academia.repository.AlunoRepository;
import br.com.academia.repository.PlanoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PlanoService {

    private final PlanoRepository planoRepository;
    private final AlunoRepository alunoRepository;

    public PlanoService(PlanoRepository planoRepository, AlunoRepository alunoRepository) {
        this.planoRepository = planoRepository;
        this.alunoRepository = alunoRepository;
    }

    @Transactional(readOnly = true)
    public List<PlanoDTO.Response> listar(boolean apenasAtivos) {
        List<Plano> planos = apenasAtivos
                ? planoRepository.findByAtivoTrueOrderByDuracaoMesesAsc()
                : planoRepository.findAllByOrderByDuracaoMesesAscNomeAsc();
        return planos.stream().map(this::paraResponse).toList();
    }

    @Transactional(readOnly = true)
    public PlanoDTO.Response buscar(Long id) {
        return paraResponse(entidade(id));
    }

    @Transactional
    public PlanoDTO.Response criar(PlanoDTO.Request req) {
        String nome = req.nome().trim();
        if (planoRepository.existsByNomeIgnoreCase(nome)) {
            throw new RegraNegocioException("Já existe um plano com o nome \"" + nome + "\".");
        }
        Plano plano = new Plano();
        preencher(plano, req);
        return paraResponse(planoRepository.save(plano));
    }

    @Transactional
    public PlanoDTO.Response atualizar(Long id, PlanoDTO.Request req) {
        Plano plano = entidade(id);
        if (planoRepository.existsByNomeIgnoreCaseAndIdNot(req.nome().trim(), id)) {
            throw new RegraNegocioException("Já existe outro plano com o nome \"" + req.nome().trim() + "\".");
        }
        preencher(plano, req);
        return paraResponse(plano);
    }

    @Transactional
    public PlanoDTO.Response alterarStatus(Long id, boolean ativo) {
        Plano plano = entidade(id);
        plano.setAtivo(ativo);
        return paraResponse(plano);
    }

    @Transactional
    public void excluir(Long id) {
        Plano plano = entidade(id);
        long alunos = alunoRepository.countByPlanoId(id);
        if (alunos > 0) {
            throw new RegraNegocioException("O plano \"" + plano.getNome() + "\" possui " + alunos
                    + " aluno(s) vinculado(s). Inative o plano em vez de excluí-lo.");
        }
        planoRepository.delete(plano);
    }

    public Plano entidade(Long id) {
        return planoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Plano", id));
    }

    private void preencher(Plano plano, PlanoDTO.Request req) {
        plano.setNome(req.nome().trim());
        plano.setDescricao(req.descricao());
        plano.setValorMensal(req.valorMensal());
        plano.setDuracaoMeses(req.duracaoMeses());
        if (req.ativo() != null) {
            plano.setAtivo(req.ativo());
        }
    }

    private PlanoDTO.Response paraResponse(Plano p) {
        return PlanoDTO.Response.de(p, alunoRepository.countByPlanoId(p.getId()));
    }
}
