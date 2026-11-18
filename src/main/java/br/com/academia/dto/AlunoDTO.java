package br.com.academia.dto;

import br.com.academia.model.Aluno;
import br.com.academia.service.CpfUtil;
import jakarta.validation.constraints.*;

import java.time.LocalDate;

public final class AlunoDTO {

    private AlunoDTO() {
    }

    public record Request(
            @NotBlank(message = "Informe o nome do aluno.")
            @Size(min = 3, max = 120, message = "O nome deve ter entre 3 e 120 caracteres.")
            String nome,

            @NotBlank(message = "Informe o CPF.")
            String cpf,

            @Email(message = "E-mail inválido.")
            @Size(max = 120)
            String email,

            @Size(max = 20, message = "Telefone muito longo.")
            String telefone,

            @Past(message = "A data de nascimento deve estar no passado.")
            LocalDate dataNascimento,

            LocalDate dataMatricula,

            Long planoId,

            Boolean ativo
    ) {
    }

    public record Response(
            Long id,
            String nome,
            String cpf,
            String email,
            String telefone,
            LocalDate dataNascimento,
            Integer idade,
            LocalDate dataMatricula,
            boolean ativo,
            Long planoId,
            String planoNome,
            boolean inadimplente
    ) {
        public static Response de(Aluno a, boolean inadimplente) {
            return new Response(a.getId(), a.getNome(), CpfUtil.formatar(a.getCpf()), a.getEmail(),
                    a.getTelefone(), a.getDataNascimento(), a.getIdade(), a.getDataMatricula(), a.isAtivo(),
                    a.getPlano() != null ? a.getPlano().getId() : null,
                    a.getPlano() != null ? a.getPlano().getNome() : null,
                    inadimplente);
        }
    }
}
