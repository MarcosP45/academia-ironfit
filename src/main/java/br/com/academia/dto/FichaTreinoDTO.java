package br.com.academia.dto;

import br.com.academia.model.FichaTreino;
import br.com.academia.model.ItemTreino;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

public final class FichaTreinoDTO {

    private FichaTreinoDTO() {
    }

    public record ItemRequest(
            @NotBlank(message = "Informe o nome do exercício.")
            @Size(max = 120)
            String exercicio,

            @Size(max = 60)
            String grupoMuscular,

            @NotNull(message = "Informe o número de séries.")
            @Min(value = 1, message = "Mínimo de 1 série.")
            @Max(value = 20, message = "Máximo de 20 séries.")
            Integer series,

            @NotBlank(message = "Informe as repetições.")
            @Size(max = 30)
            String repeticoes,

            @PositiveOrZero(message = "A carga não pode ser negativa.")
            Double carga,

            @PositiveOrZero(message = "O descanso não pode ser negativo.")
            Integer descansoSegundos,

            @Size(max = 255)
            String observacao
    ) {
    }

    public record Request(
            @NotNull(message = "Selecione o aluno.")
            Long alunoId,

            Long professorId,

            @NotBlank(message = "Informe o nome da ficha.")
            @Size(max = 120)
            String nome,

            @Size(max = 80)
            String objetivo,

            @NotNull(message = "Informe a data de início.")
            LocalDate dataInicio,

            LocalDate dataFim,

            Boolean ativa,

            @Size(max = 500)
            String observacoes,

            @NotEmpty(message = "Adicione pelo menos um exercício.")
            List<@Valid ItemRequest> itens
    ) {
    }

    public record ItemResponse(
            Long id,
            Integer ordem,
            String exercicio,
            String grupoMuscular,
            Integer series,
            String repeticoes,
            Double carga,
            Integer descansoSegundos,
            String observacao
    ) {
        public static ItemResponse de(ItemTreino i) {
            return new ItemResponse(i.getId(), i.getOrdem(), i.getExercicio(), i.getGrupoMuscular(),
                    i.getSeries(), i.getRepeticoes(), i.getCarga(), i.getDescansoSegundos(), i.getObservacao());
        }
    }

    public record Response(
            Long id,
            String nome,
            String objetivo,
            Long alunoId,
            String alunoNome,
            Long professorId,
            String professorNome,
            LocalDate dataInicio,
            LocalDate dataFim,
            boolean ativa,
            boolean vencida,
            String observacoes,
            int totalExercicios,
            List<ItemResponse> itens
    ) {
        public static Response de(FichaTreino f) {
            List<ItemResponse> itens = f.getItens().stream().map(ItemResponse::de).toList();
            return new Response(f.getId(), f.getNome(), f.getObjetivo(),
                    f.getAluno().getId(), f.getAluno().getNome(),
                    f.getProfessor() != null ? f.getProfessor().getId() : null,
                    f.getProfessor() != null ? f.getProfessor().getNome() : null,
                    f.getDataInicio(), f.getDataFim(), f.isAtiva(), f.isVencida(), f.getObservacoes(),
                    itens.size(), itens);
        }
    }
}
