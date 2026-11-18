package br.com.academia.dto;

import br.com.academia.model.FormaPagamento;
import br.com.academia.model.Mensalidade;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public final class MensalidadeDTO {

    private MensalidadeDTO() {
    }

    public record Request(
            @NotNull(message = "Selecione o aluno.")
            Long alunoId,

            @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero.")
            BigDecimal valor,

            @NotNull(message = "Informe a data de vencimento.")
            LocalDate dataVencimento,

            @Size(max = 120)
            String descricao
    ) {
    }

    public record GerarRequest(
            @NotNull(message = "Selecione o aluno.")
            Long alunoId,

            @NotNull(message = "Informe a quantidade de meses.")
            @Min(value = 1, message = "Mínimo de 1 mês.")
            @Max(value = 12, message = "Máximo de 12 meses por vez.")
            Integer quantidade,

            LocalDate primeiroVencimento
    ) {
    }

    public record PagamentoRequest(
            @PastOrPresent(message = "A data de pagamento não pode ser futura.")
            LocalDate dataPagamento,

            @NotNull(message = "Selecione a forma de pagamento.")
            FormaPagamento formaPagamento
    ) {
    }

    public record Response(
            Long id,
            Long alunoId,
            String alunoNome,
            String descricao,
            BigDecimal valor,
            LocalDate dataVencimento,
            LocalDate dataPagamento,
            BigDecimal valorPago,
            FormaPagamento formaPagamento,
            String status,
            String situacao,
            long diasAtraso,
            BigDecimal valorAtualizado
    ) {
        public static Response de(Mensalidade m, BigDecimal valorAtualizado) {
            long dias = m.isAtrasada() ? ChronoUnit.DAYS.between(m.getDataVencimento(), LocalDate.now()) : 0;
            return new Response(m.getId(), m.getAluno().getId(), m.getAluno().getNome(), m.getDescricao(),
                    m.getValor(), m.getDataVencimento(), m.getDataPagamento(), m.getValorPago(),
                    m.getFormaPagamento(), m.getStatus().name(), m.getSituacao(), dias, valorAtualizado);
        }
    }
}
