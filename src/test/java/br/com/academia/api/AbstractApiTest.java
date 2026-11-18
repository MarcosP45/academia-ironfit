package br.com.academia.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jayway.jsonpath.JsonPath;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:academia-teste;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "academia.dados-exemplo=false"
})
@AutoConfigureMockMvc
abstract class AbstractApiTest {

    private static final AtomicInteger SEQ = new AtomicInteger(1000);

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    protected static int proximo() {
        return SEQ.incrementAndGet();
    }

    protected static String cpfValido() {
        int n = proximo();
        int[] d = new int[11];
        String base = String.format("%09d", 100_000_000 + n * 7919);
        for (int i = 0; i < 9; i++) d[i] = base.charAt(i) - '0';
        for (int t = 9; t <= 10; t++) {
            int soma = 0;
            for (int i = 0; i < t; i++) soma += d[i] * (t + 1 - i);
            int resto = (soma * 10) % 11;
            d[t] = resto == 10 ? 0 : resto;
        }
        StringBuilder s = new StringBuilder();
        for (int x : d) s.append(x);
        return s.substring(0, 3) + "." + s.substring(3, 6) + "." + s.substring(6, 9) + "-" + s.substring(9);
    }

    protected static Map<String, Object> mapa(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put((String) kv[i], kv[i + 1]);
        return m;
    }

    protected ResultActions postJson(String url, Object corpo) throws Exception {
        return mvc.perform(post(url).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo)));
    }

    protected ResultActions putJson(String url, Object corpo) throws Exception {
        return mvc.perform(put(url).contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(corpo)));
    }

    protected ResultActions patchJson(String url, Object corpo) throws Exception {
        MockHttpServletRequestBuilder b = patch(url).contentType(MediaType.APPLICATION_JSON);
        if (corpo != null) b.content(json.writeValueAsString(corpo));
        return mvc.perform(b);
    }

    protected ResultActions getUrl(String url) throws Exception {
        return mvc.perform(get(url));
    }

    protected ResultActions deleteUrl(String url) throws Exception {
        return mvc.perform(delete(url));
    }

    protected static <T> T ler(ResultActions r, String path) throws Exception {
        return JsonPath.read(r.andReturn().getResponse().getContentAsString(), path);
    }

    protected static long id(ResultActions r) throws Exception {
        Number n = ler(r, "$.id");
        return n.longValue();
    }

    protected long criarPlano(String nome, double valorMensal, int meses) throws Exception {
        return id(postJson("/api/planos", mapa("nome", nome, "valorMensal", valorMensal, "duracaoMeses", meses))
                .andExpect(status().isCreated()));
    }

    protected long criarPlanoUnico(int meses) throws Exception {
        return criarPlano("Plano " + proximo(), 100.0, meses);
    }

    protected long criarProfessor() throws Exception {
        int n = proximo();
        return id(postJson("/api/professores", mapa(
                "nome", "Professor " + n, "cpf", cpfValido(), "cref", "CREF-" + n,
                "email", "prof" + n + "@academia.com", "telefone", "(24) 99999-0000",
                "especialidade", "Musculacao")).andExpect(status().isCreated()));
    }

    protected long criarAluno(Long planoId) throws Exception {
        int n = proximo();
        Map<String, Object> corpo = mapa("nome", "Aluno Teste " + n, "cpf", cpfValido(),
                "email", "aluno" + n + "@email.com", "telefone", "(24) 98888-0000",
                "dataNascimento", LocalDate.of(1995, 5, 20));
        if (planoId != null) corpo.put("planoId", planoId);
        return id(postJson("/api/alunos", corpo).andExpect(status().isCreated()));
    }

    protected Map<String, Object> exercicio(String nome, int series, String reps) {
        return mapa("exercicio", nome, "series", series, "repeticoes", reps, "carga", 20, "descansoSegundos", 60);
    }

    protected long criarFicha(long alunoId, Long professorId, String nome, LocalDate inicio, LocalDate fim,
                              List<Map<String, Object>> itens) throws Exception {
        Map<String, Object> corpo = mapa("alunoId", alunoId, "nome", nome, "objetivo", "Hipertrofia",
                "dataInicio", inicio, "itens", new ArrayList<>(itens));
        if (professorId != null) corpo.put("professorId", professorId);
        if (fim != null) corpo.put("dataFim", fim);
        return id(postJson("/api/fichas", corpo).andExpect(status().isCreated()));
    }

    protected ResultActions registrarAvaliacao(long alunoId, Long professorId, LocalDate data,
                                               double peso, double altura, double gordura) throws Exception {
        Map<String, Object> corpo = mapa("alunoId", alunoId, "dataAvaliacao", data,
                "peso", peso, "altura", altura, "percentualGordura", gordura);
        if (professorId != null) corpo.put("professorId", professorId);
        return postJson("/api/avaliacoes", corpo);
    }
}
