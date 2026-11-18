package br.com.academia.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Avaliacoes fisicas")
class AvaliacaoFisicaApiTest extends AbstractApiTest {

    @Test
    @DisplayName("registra avaliacao e calcula IMC, classificacao, massa gorda e massa magra")
    void calculaIndicadores() throws Exception {
        long aluno = criarAluno(null);
        registrarAvaliacao(aluno, null, LocalDate.now(), 80, 1.75, 20)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.imc").value(26.1))
                .andExpect(jsonPath("$.classificacaoImc").value("Sobrepeso"))
                .andExpect(jsonPath("$.massaGorda").value(16.0))
                .andExpect(jsonPath("$.massaMagra").value(64.0));
    }

    @Test
    @DisplayName("classifica o IMC conforme a OMS")
    void classificacaoOms() throws Exception {
        long aluno = criarAluno(null);
        registrarAvaliacao(aluno, null, LocalDate.now(), 50, 1.75, 15)
                .andExpect(jsonPath("$.classificacaoImc").value("Abaixo do peso"));
        registrarAvaliacao(aluno, null, LocalDate.now(), 70, 1.75, 15)
                .andExpect(jsonPath("$.classificacaoImc").value("Peso normal"));
        registrarAvaliacao(aluno, null, LocalDate.now(), 100, 1.75, 25)
                .andExpect(jsonPath("$.classificacaoImc").value("Obesidade grau I"));
    }

    @Test
    @DisplayName("registra com medidas, pressao arterial e frequencia cardiaca, e consulta por id e por aluno")
    void registraCompletaEConsulta() throws Exception {
        long prof = criarProfessor();
        long aluno = criarAluno(null);
        long av = id(postJson("/api/avaliacoes", mapa("alunoId", aluno, "professorId", prof,
                "dataAvaliacao", LocalDate.now(), "peso", 72.5, "altura", 1.70, "percentualGordura", 18.0,
                "cintura", 80.0, "quadril", 100.0, "frequenciaCardiacaRepouso", 62, "pressaoArterial", "120/80"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.relacaoCinturaQuadril").value(0.8)));

        getUrl("/api/avaliacoes/" + av)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pressaoArterial").value("120/80"))
                .andExpect(jsonPath("$.professorId").value((int) prof));
        getUrl("/api/avaliacoes?alunoId=" + aluno).andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("acompanhamento: compara a primeira e a ultima avaliacao")
    void evolucao() throws Exception {
        long aluno = criarAluno(null);
        registrarAvaliacao(aluno, null, LocalDate.now().minusDays(60), 85, 1.75, 25).andExpect(status().isCreated());
        registrarAvaliacao(aluno, null, LocalDate.now().minusDays(30), 82, 1.75, 22).andExpect(status().isCreated());
        registrarAvaliacao(aluno, null, LocalDate.now(), 80, 1.75, 20).andExpect(status().isCreated());

        getUrl("/api/avaliacoes/evolucao/" + aluno)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalAvaliacoes").value(3))
                .andExpect(jsonPath("$.primeira.peso").value(85.0))
                .andExpect(jsonPath("$.ultima.peso").value(80.0))
                .andExpect(jsonPath("$.variacaoPeso").value(-5.0))
                .andExpect(jsonPath("$.variacaoPercentualGordura").value(-5.0))
                .andExpect(jsonPath("$.historico.length()").value(3));
    }

    @Test
    @DisplayName("edita e exclui avaliacao")
    void editaEExclui() throws Exception {
        long aluno = criarAluno(null);
        long av = id(registrarAvaliacao(aluno, null, LocalDate.now(), 80, 1.75, 20).andExpect(status().isCreated()));

        putJson("/api/avaliacoes/" + av, mapa("alunoId", aluno, "dataAvaliacao", LocalDate.now(),
                "peso", 78.0, "altura", 1.75, "percentualGordura", 19.0))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.peso").value(78.0));

        deleteUrl("/api/avaliacoes/" + av).andExpect(status().isNoContent());
        getUrl("/api/avaliacoes/" + av).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("validacao: peso/altura obrigatorios, altura em metros, data nao pode ser futura (400)")
    void validacao() throws Exception {
        long aluno = criarAluno(null);

        postJson("/api/avaliacoes", mapa("alunoId", aluno, "dataAvaliacao", LocalDate.now()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.peso").exists())
                .andExpect(jsonPath("$.campos.altura").exists());

        registrarAvaliacao(aluno, null, LocalDate.now(), 80, 175, 20)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.altura").exists());

        registrarAvaliacao(aluno, null, LocalDate.now().plusDays(3), 80, 1.75, 20)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.dataAvaliacao").exists());
    }

    @Test
    @DisplayName("avaliacao para aluno inexistente retorna 404")
    void alunoInexistente() throws Exception {
        registrarAvaliacao(999999, null, LocalDate.now(), 80, 1.75, 20).andExpect(status().isNotFound());
    }
}
