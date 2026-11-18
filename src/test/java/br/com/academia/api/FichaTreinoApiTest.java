package br.com.academia.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Fichas de treino")
class FichaTreinoApiTest extends AbstractApiTest {

    @Test
    @DisplayName("cria ficha com exercicios na ordem informada e consulta pelo id")
    void criaEConsulta() throws Exception {
        long prof = criarProfessor();
        long aluno = criarAluno(null);
        long ficha = criarFicha(aluno, prof, "Treino A", LocalDate.now(), LocalDate.now().plusMonths(2),
                List.of(exercicio("Supino reto", 4, "10"), exercicio("Agachamento", 3, "12"), exercicio("Remada", 3, "10")));

        getUrl("/api/fichas/" + ficha)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Treino A"))
                .andExpect(jsonPath("$.alunoId").value((int) aluno))
                .andExpect(jsonPath("$.professorId").value((int) prof))
                .andExpect(jsonPath("$.totalExercicios").value(3))
                .andExpect(jsonPath("$.itens[0].exercicio").value("Supino reto"))
                .andExpect(jsonPath("$.itens[1].exercicio").value("Agachamento"))
                .andExpect(jsonPath("$.itens[2].exercicio").value("Remada"))
                .andExpect(jsonPath("$.ativa").value(true))
                .andExpect(jsonPath("$.vencida").value(false));
    }

    @Test
    @DisplayName("lista fichas filtrando por aluno")
    void listaPorAluno() throws Exception {
        long aluno = criarAluno(null);
        long outro = criarAluno(null);
        long ficha = criarFicha(aluno, null, "Ficha do aluno", LocalDate.now(), null, List.of(exercicio("Rosca", 3, "12")));
        criarFicha(outro, null, "Ficha do outro", LocalDate.now(), null, List.of(exercicio("Rosca", 3, "12")));

        getUrl("/api/fichas?alunoId=" + aluno)
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value((int) ficha));
    }

    @Test
    @DisplayName("edita ficha trocando os exercicios")
    void edita() throws Exception {
        long aluno = criarAluno(null);
        long ficha = criarFicha(aluno, null, "Treino B", LocalDate.now(), null, List.of(exercicio("Supino", 3, "10")));

        putJson("/api/fichas/" + ficha, mapa("alunoId", aluno, "nome", "Treino B v2", "dataInicio", LocalDate.now(),
                "itens", List.of(exercicio("Leg press", 4, "15"), exercicio("Cadeira extensora", 3, "12"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Treino B v2"))
                .andExpect(jsonPath("$.totalExercicios").value(2))
                .andExpect(jsonPath("$.itens[0].exercicio").value("Leg press"));
    }

    @Test
    @DisplayName("ficha com data de termino no passado fica VENCIDA")
    void ficaVencida() throws Exception {
        long aluno = criarAluno(null);
        long ficha = criarFicha(aluno, null, "Treino Antigo", LocalDate.now().minusDays(60),
                LocalDate.now().minusDays(1), List.of(exercicio("Supino", 3, "10")));
        getUrl("/api/fichas/" + ficha).andExpect(jsonPath("$.vencida").value(true));
    }

    @Test
    @DisplayName("duplicar gera uma copia com os mesmos exercicios")
    void duplica() throws Exception {
        long aluno = criarAluno(null);
        long ficha = criarFicha(aluno, null, "Treino C", LocalDate.now(), null,
                List.of(exercicio("Supino", 3, "10"), exercicio("Crucifixo", 3, "12")));

        var copia = postJson("/api/fichas/" + ficha + "/duplicar", null)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.nome").value("Treino C (cópia)"))
                .andExpect(jsonPath("$.totalExercicios").value(2))
                .andExpect(jsonPath("$.alunoId").value((int) aluno));
        long copiaId = id(copia);
        org.junit.jupiter.api.Assertions.assertNotEquals(ficha, copiaId);
    }

    @Test
    @DisplayName("ativar e desativar ficha; filtro de ativas")
    void alteraStatus() throws Exception {
        long aluno = criarAluno(null);
        long ficha = criarFicha(aluno, null, "Treino D", LocalDate.now(), null, List.of(exercicio("Supino", 3, "10")));

        patchJson("/api/fichas/" + ficha + "/status?ativa=false", null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.ativa").value(false));
        getUrl("/api/fichas?ativas=true").andExpect(jsonPath("$[*].id").value(not(hasItem((int) ficha))));
        patchJson("/api/fichas/" + ficha + "/status?ativa=true", null).andExpect(jsonPath("$.ativa").value(true));
    }

    @Test
    @DisplayName("exclui ficha: 204 e depois 404")
    void exclui() throws Exception {
        long aluno = criarAluno(null);
        long ficha = criarFicha(aluno, null, "Treino E", LocalDate.now(), null, List.of(exercicio("Supino", 3, "10")));
        deleteUrl("/api/fichas/" + ficha).andExpect(status().isNoContent());
        getUrl("/api/fichas/" + ficha).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("rejeita data de termino anterior ao inicio (422) e series fora do intervalo (400)")
    void validacoes() throws Exception {
        long aluno = criarAluno(null);
        postJson("/api/fichas", mapa("alunoId", aluno, "nome", "Datas ruins", "dataInicio", LocalDate.now(),
                "dataFim", LocalDate.now().minusDays(3), "itens", List.of(exercicio("Supino", 3, "10"))))
                .andExpect(status().isUnprocessableEntity());

        postJson("/api/fichas", mapa("alunoId", aluno, "nome", "Series ruins", "dataInicio", LocalDate.now(),
                "itens", List.of(exercicio("Supino", 99, "10"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("ficha para aluno inexistente retorna 404")
    void alunoInexistente() throws Exception {
        postJson("/api/fichas", mapa("alunoId", 999999, "nome", "Sem aluno", "dataInicio", LocalDate.now(),
                "itens", List.of(exercicio("Supino", 3, "10"))))
                .andExpect(status().isNotFound());
    }
}
