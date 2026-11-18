package br.com.academia.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Alunos")
class AlunoApiTest extends AbstractApiTest {

    @Test
    @DisplayName("cadastra, consulta por id e aparece na listagem")
    void cadastraEConsulta() throws Exception {
        long id = criarAluno(null);

        getUrl("/api/alunos/" + id)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value(org.hamcrest.Matchers.startsWith("Aluno Teste")))
                .andExpect(jsonPath("$.ativo").value(true))
                .andExpect(jsonPath("$.idade").isNumber());

        getUrl("/api/alunos").andExpect(status().isOk()).andExpect(jsonPath("$[*].id").value(hasItem((int) id)));
    }

    @Test
    @DisplayName("busca por nome e por CPF")
    void busca() throws Exception {
        String cpf = cpfValido();
        String nome = "Zuleica Buscavel " + proximo();
        postJson("/api/alunos", mapa("nome", nome, "cpf", cpf, "email", "z@email.com", "telefone", "(24) 90000-0000",
                "dataNascimento", LocalDate.of(1990, 1, 1))).andExpect(status().isCreated());

        getUrl("/api/alunos?busca=Zuleica Buscavel").andExpect(jsonPath("$[?(@.nome=='" + nome + "')]").isNotEmpty());
        String digitos = cpf.replaceAll("\\D", "");
        getUrl("/api/alunos?busca=" + cpf).andExpect(jsonPath("$[?(@.nome=='" + nome + "')]").isNotEmpty());
        getUrl("/api/alunos?busca=" + digitos).andExpect(jsonPath("$[?(@.nome=='" + nome + "')]").isNotEmpty());
        getUrl("/api/alunos?busca=" + cpf.substring(0, 7)).andExpect(jsonPath("$[?(@.nome=='" + nome + "')]").isNotEmpty());
        getUrl("/api/alunos?busca=NomeQueNaoExiste999").andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("edita os dados do aluno")
    void edita() throws Exception {
        long id = criarAluno(null);
        String cpf = ler(getUrl("/api/alunos/" + id), "$.cpf");
        putJson("/api/alunos/" + id, mapa("nome", "Nome Alterado", "cpf", cpf,
                "email", "novo@email.com", "telefone", "(24) 97777-0000",
                "dataNascimento", LocalDate.of(1990, 1, 1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Nome Alterado"));
        getUrl("/api/alunos/" + id).andExpect(jsonPath("$.email").value("novo@email.com"));
    }

    @Test
    @DisplayName("exclui o aluno: 204 e depois 404")
    void exclui() throws Exception {
        long id = criarAluno(null);
        deleteUrl("/api/alunos/" + id).andExpect(status().isNoContent());
        getUrl("/api/alunos/" + id).andExpect(status().isNotFound());
        getUrl("/api/alunos").andExpect(jsonPath("$[*].id").value(not(hasItem((int) id))));
    }

    @Test
    @DisplayName("excluir aluno remove tambem as mensalidades dele")
    void excluirRemoveMensalidades() throws Exception {
        long plano = criarPlanoUnico(3);
        long aluno = criarAluno(plano);
        getUrl("/api/mensalidades?alunoId=" + aluno).andExpect(jsonPath("$.length()").value(3));

        deleteUrl("/api/alunos/" + aluno).andExpect(status().isNoContent());
        getUrl("/api/mensalidades?alunoId=" + aluno).andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("inativar e reativar aluno")
    void alteraStatus() throws Exception {
        long id = criarAluno(null);
        patchJson("/api/alunos/" + id + "/status?ativo=false", null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.ativo").value(false));
        patchJson("/api/alunos/" + id + "/status?ativo=true", null)
                .andExpect(jsonPath("$.ativo").value(true));
    }

    @Test
    @DisplayName("rejeita CPF invalido (422)")
    void rejeitaCpfInvalido() throws Exception {
        postJson("/api/alunos", mapa("nome", "Fulano de Tal", "cpf", "123.456.789-00",
                "email", "f@email.com", "telefone", "(24) 90000-0000", "dataNascimento", LocalDate.of(2000, 1, 1)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.mensagem").value("CPF inválido."));
    }

    @Test
    @DisplayName("rejeita CPF duplicado (422)")
    void rejeitaCpfDuplicado() throws Exception {
        String cpf = cpfValido();
        var corpo = mapa("nome", "Primeiro Aluno", "cpf", cpf, "email", "a@email.com",
                "telefone", "(24) 90000-0000", "dataNascimento", LocalDate.of(2000, 1, 1));
        postJson("/api/alunos", corpo).andExpect(status().isCreated());
        postJson("/api/alunos", corpo)
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.mensagem").value("Já existe um aluno cadastrado com este CPF."));
    }

    @Test
    @DisplayName("validacao de campos: nome curto e e-mail invalido (400 com 'campos')")
    void validaCampos() throws Exception {
        postJson("/api/alunos", mapa("nome", "Ab", "cpf", cpfValido(), "email", "nao-e-email",
                "telefone", "(24) 90000-0000", "dataNascimento", LocalDate.of(2000, 1, 1)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.nome").exists())
                .andExpect(jsonPath("$.campos.email").exists());
    }

    @Test
    @DisplayName("data de nascimento no futuro e rejeitada")
    void rejeitaNascimentoFuturo() throws Exception {
        postJson("/api/alunos", mapa("nome", "Aluno Futuro", "cpf", cpfValido(), "email", "f@email.com",
                "telefone", "(24) 90000-0000", "dataNascimento", LocalDate.now().plusDays(5)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.dataNascimento").exists());
    }

    @Test
    @DisplayName("consultar aluno inexistente retorna 404")
    void inexistente() throws Exception {
        getUrl("/api/alunos/999999").andExpect(status().isNotFound());
    }
}
