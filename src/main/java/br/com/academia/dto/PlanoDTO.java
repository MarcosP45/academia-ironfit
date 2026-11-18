package br.com.academia.dto;

import br.com.academia.model.Plano;
import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public final class PlanoDTO {

    private PlanoDTO() {
    }

    public record Request(
            @NotBlank(message = "Informe o nome do plano.")
            @Size(max = 80, message = "O nome deve ter no máximo 80 caracteres.")
            String nome,

            @Size(max = 500, message = "A descrição deve ter no máximo 500 caracteres.")
            String descricao,

            @NotNull(message = "Informe o valor mensal.")
            @DecimalMin(value = "0.01", message = "O valor mensal deve ser maior que zero.")
            BigDecimal valorMensal,

            @NotNull(message = "Informe a duração em meses.")
            @Min(value = 1, message = "A duração mínima é 1 mês.")
            @Max(value = 36, message = "A duração máxima é 36 meses.")
            Integer duracaoMeses,

            Boolean ativo
    ) {
    }

    public record Response(
            Long id,
            String nome,
            String descricao,
            BigDecimal valorMensal,
            Integer duracaoMeses,
            BigDecimal valorTotal,
            boolean ativo,
            long quantidadeAlunos
    ) {
        public static Response de(Plano p, long quantidadeAlunos) {
            return new Response(p.getId(), p.getNome(), p.getDescricao(), p.getValorMensal(),
                    p.getDuracaoMeses(), p.getValorTotal(), p.isAtivo(), quantidadeAlunos);
        }
    }
}
