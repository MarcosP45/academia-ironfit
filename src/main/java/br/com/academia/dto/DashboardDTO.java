package br.com.academia.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardDTO(
        long alunosAtivos,
        long totalAlunos,
        long professoresAtivos,
        long planosAtivos,
        long fichasAtivas,
        long mensalidadesAtrasadas,
        long alunosInadimplentes,
        BigDecimal valorEmAtraso,
        BigDecimal recebidoNoMes,
        BigDecimal aReceberNoMes,
        long avaliacoesNoMes,
        List<MensalidadeDTO.Response> mensalidadesEmAtraso,
        List<MensalidadeDTO.Response> proximosVencimentos
) {
}
