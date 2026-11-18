package br.com.academia.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Professores")
class ProfessorApiTest extends AbstractApiTest {

    @Test
    @DisplayName("cadastra e consulta por id e pela listagem")
    void cadastraEConsulta() throws Exception {
        long id = criarProfessor();
        getUrl("/api/professores/" + id)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ativo").value(true))
                .andExpect(jsonPath("$.especialidade").value("Musculacao"));
        getUrl("/api/professores").andExpect(jsonPath("$[*].id").value(hasItem((int) id)));
    }

    @Test
    @DisplayName("busca por especialidade")
    void buscaPorEspecialidade() throws Exception {
        String esp = "Pilates" + proximo();
        postJson("/api/professores", mapa("nome", "Professora Pilates", "cpf", cpfValido(),
                "cref", "CREF-P" + proximo(), "especialidade", esp)).andExpect(status().isCreated());
        getUrl("/api/professores?busca=" + esp).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("edita e inativa o professor")
    void editaEInativa() throws Exception {
        long id = criarProfessor();
        String cpf = ler(getUrl("/api/professores/" + id), "$.cpf");
        String cref = ler(getUrl("/api/professores/" + id), "$.cref");
        putJson("/api/professores/" + id, mapa("nome", "Professor Editado", "cpf", cpf, "cref", cref,
                "especialidade", "Funcional")).andExpect(status().isOk())
                .andExpect(jsonPath("$.especialidade").value("Funcional"));
        patchJson("/api/professores/" + id + "/status?ativo=false", null)
                .andExpect(jsonPath("$.ativo").value(false));
    }

    @Test
    @DisplayName("exclui professor sem vinculos: 204 e depois 404")
    void exclui() throws Exception {
        long id = criarProfessor();
        deleteUrl("/api/professores/" + id).andExpect(status().isNoContent());
        getUrl("/api/professores/" + id).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("bloqueia exclusao de professor com ficha de treino (422)")
    void bloqueiaExclusaoComFicha() throws Exception {
        long prof = criarProfessor();
        long aluno = criarAluno(null);
        criarFicha(aluno, prof, "Ficha A", LocalDate.now(), null, java.util.List.of(exercicio("Supino", 3, "10")));
        deleteUrl("/api/professores/" + prof).andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("CPF e CREF repetidos sao rejeitados (422)")
    void duplicados() throws Exception {
        String cpf = cpfValido();
        String cref = "CREF-D" + proximo();
        postJson("/api/professores", mapa("nome", "Professor Um", "cpf", cpf, "cref", cref))
                .andExpect(status().isCreated());

        postJson("/api/professores", mapa("nome", "Professor Dois", "cpf", cpf, "cref", "CREF-X" + proximo()))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.mensagem").value("Já existe um professor cadastrado com este CPF."));
        postJson("/api/professores", mapa("nome", "Professor Tres", "cpf", cpfValido(), "cref", cref))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.mensagem").value("Já existe um professor cadastrado com este CREF."));
    }

    @Test
    @DisplayName("validacao: CREF obrigatorio e CPF invalido")
    void validacao() throws Exception {
        postJson("/api/professores", mapa("nome", "Professor Sem Cref", "cpf", cpfValido()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.cref").exists());
        postJson("/api/professores", mapa("nome", "Professor CPF Ruim", "cpf", "111.111.111-11", "cref", "CREF-Z" + proximo()))
                .andExpect(status().isUnprocessableEntity());
    }
}
