package br.com.academia.dto;

import br.com.academia.model.AvaliacaoFisica;
import jakarta.validation.constraints.*;

import java.time.LocalDate;
import java.util.List;

public final class AvaliacaoFisicaDTO {

    private AvaliacaoFisicaDTO() {
    }

    public record Request(
            @NotNull(message = "Selecione o aluno.")
            Long alunoId,

            Long professorId,

            @NotNull(message = "Informe a data da avaliação.")
            @PastOrPresent(message = "A data da avaliação não pode ser futura.")
            LocalDate dataAvaliacao,

            @NotNull(message = "Informe o peso.")
            @DecimalMin(value = "20", message = "Peso mínimo: 20 kg.")
            @DecimalMax(value = "350", message = "Peso máximo: 350 kg.")
            Double peso,

            @NotNull(message = "Informe a altura.")
            @DecimalMin(value = "1.00", message = "Altura mínima: 1,00 m.")
            @DecimalMax(value = "2.50", message = "Altura máxima: 2,50 m (use metros, ex.: 1.75).")
            Double altura,

            @DecimalMin(value = "2", message = "% de gordura mínimo: 2.")
            @DecimalMax(value = "70", message = "% de gordura máximo: 70.")
            Double percentualGordura,

            @Positive(message = "Tórax deve ser positivo.") Double torax,
            @Positive(message = "Cintura deve ser positiva.") Double cintura,
            @Positive(message = "Abdômen deve ser positivo.") Double abdomen,
            @Positive(message = "Quadril deve ser positivo.") Double quadril,
            @Positive(message = "Braço deve ser positivo.") Double bracoDireito,
            @Positive(message = "Coxa deve ser positiva.") Double coxaDireita,

            @Min(value = 30, message = "FC de repouso mínima: 30 bpm.")
            @Max(value = 200, message = "FC de repouso máxima: 200 bpm.")
            Integer frequenciaCardiacaRepouso,

            @Pattern(regexp = "^$|^\\d{2,3}/\\d{2,3}$", message = "Pressão no formato 120/80.")
            String pressaoArterial,

            @Size(max = 1000)
            String observacoes
    ) {
    }

    public record Response(
            Long id,
            Long alunoId,
            String alunoNome,
            Long professorId,
            String professorNome,
            LocalDate dataAvaliacao,
            Double peso,
            Double altura,
            Double percentualGordura,
            Double torax,
            Double cintura,
            Double abdomen,
            Double quadril,
            Double bracoDireito,
            Double coxaDireita,
            Integer frequenciaCardiacaRepouso,
            String pressaoArterial,
            String observacoes,
            Double imc,
            String classificacaoImc,
            Double massaGorda,
            Double massaMagra,
            Double relacaoCinturaQuadril
    ) {
        public static Response de(AvaliacaoFisica a) {
            return new Response(a.getId(), a.getAluno().getId(), a.getAluno().getNome(),
                    a.getProfessor() != null ? a.getProfessor().getId() : null,
                    a.getProfessor() != null ? a.getProfessor().getNome() : null,
                    a.getDataAvaliacao(), a.getPeso(), a.getAltura(), a.getPercentualGordura(),
                    a.getTorax(), a.getCintura(), a.getAbdomen(), a.getQuadril(), a.getBracoDireito(),
                    a.getCoxaDireita(), a.getFrequenciaCardiacaRepouso(), a.getPressaoArterial(),
                    a.getObservacoes(), a.getImc(), a.getClassificacaoImc(), a.getMassaGorda(),
                    a.getMassaMagra(), a.getRelacaoCinturaQuadril());
        }
    }

    public record Evolucao(
            Long alunoId,
            String alunoNome,
            int totalAvaliacoes,
            Response primeira,
            Response ultima,
            Double variacaoPeso,
            Double variacaoImc,
            Double variacaoPercentualGordura,
            Double variacaoMassaMagra,
            Double variacaoCintura,
            List<Response> historico
    ) {
    }
}
