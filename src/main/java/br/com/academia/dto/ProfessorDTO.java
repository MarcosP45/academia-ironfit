package br.com.academia.dto;

import br.com.academia.model.Professor;
import br.com.academia.service.CpfUtil;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public final class ProfessorDTO {

    private ProfessorDTO() {
    }

    public record Request(
            @NotBlank(message = "Informe o nome do professor.")
            @Size(min = 3, max = 120, message = "O nome deve ter entre 3 e 120 caracteres.")
            String nome,

            @NotBlank(message = "Informe o CPF.")
            String cpf,

            @NotBlank(message = "Informe o CREF.")
            @Size(max = 20, message = "CREF muito longo.")
            String cref,

            @Email(message = "E-mail inválido.")
            String email,

            @Size(max = 20)
            String telefone,

            @Size(max = 120)
            String especialidade,

            @PastOrPresent(message = "A data de admissão não pode ser futura.")
            LocalDate dataAdmissao,

            Boolean ativo
    ) {
    }

    public record Response(
            Long id,
            String nome,
            String cpf,
            String cref,
            String email,
            String telefone,
            String especialidade,
            LocalDate dataAdmissao,
            boolean ativo
    ) {
        public static Response de(Professor p) {
            return new Response(p.getId(), p.getNome(), CpfUtil.formatar(p.getCpf()), p.getCref(),
                    p.getEmail(), p.getTelefone(), p.getEspecialidade(), p.getDataAdmissao(), p.isAtivo());
        }
    }
}
