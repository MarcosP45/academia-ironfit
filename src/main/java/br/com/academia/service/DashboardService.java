package br.com.academia.service;

import br.com.academia.dto.DashboardDTO;
import br.com.academia.dto.MensalidadeDTO;
import br.com.academia.model.StatusMensalidade;
import br.com.academia.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class DashboardService {

    private final AlunoRepository alunoRepository;
    private final ProfessorRepository professorRepository;
    private final PlanoRepository planoRepository;
    private final FichaTreinoRepository fichaRepository;
    private final MensalidadeRepository mensalidadeRepository;
    private final AvaliacaoFisicaRepository avaliacaoRepository;
    private final MensalidadeService mensalidadeService;

    public DashboardService(AlunoRepository alunoRepository, ProfessorRepository professorRepository,
                            PlanoRepository planoRepository, FichaTreinoRepository fichaRepository,
                            MensalidadeRepository mensalidadeRepository,
                            AvaliacaoFisicaRepository avaliacaoRepository,
                            MensalidadeService mensalidadeService) {
        this.alunoRepository = alunoRepository;
        this.professorRepository = professorRepository;
        this.planoRepository = planoRepository;
        this.fichaRepository = fichaRepository;
        this.mensalidadeRepository = mensalidadeRepository;
        this.avaliacaoRepository = avaliacaoRepository;
        this.mensalidadeService = mensalidadeService;
    }

    @Transactional(readOnly = true)
    public DashboardDTO resumo() {
        LocalDate hoje = LocalDate.now();
        LocalDate inicioMes = hoje.withDayOfMonth(1);
        LocalDate fimMes = hoje.withDayOfMonth(hoje.lengthOfMonth());

        List<MensalidadeDTO.Response> atrasadas = mensalidadeRepository
                .findByStatusAndDataVencimentoBeforeOrderByDataVencimentoAsc(StatusMensalidade.PENDENTE, hoje)
                .stream().map(mensalidadeService::paraResponse).toList();

        List<MensalidadeDTO.Response> proximas = mensalidadeRepository
                .findTop8ByStatusAndDataVencimentoBetweenOrderByDataVencimentoAsc(
                        StatusMensalidade.PENDENTE, hoje, hoje.plusDays(15))
                .stream().map(mensalidadeService::paraResponse).toList();

        return new DashboardDTO(
                alunoRepository.countByAtivoTrue(),
                alunoRepository.count(),
                professorRepository.countByAtivoTrue(),
                planoRepository.countByAtivoTrue(),
                fichaRepository.countByAtivaTrue(),
                atrasadas.size(),
                mensalidadeRepository.contarAlunosInadimplentes(StatusMensalidade.PENDENTE, hoje),
                mensalidadeRepository.totalEmAtraso(hoje),
                mensalidadeRepository.totalRecebido(inicioMes, fimMes),
                mensalidadeRepository.totalAReceber(inicioMes, fimMes),
                avaliacaoRepository.countByDataAvaliacaoBetween(inicioMes, fimMes),
                atrasadas.stream().limit(8).toList(),
                proximas
        );
    }
}
