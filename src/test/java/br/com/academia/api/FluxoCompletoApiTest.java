package br.com.academia.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.util.List;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Fluxo completo (todos os modulos integrados)")
class FluxoCompletoApiTest extends AbstractApiTest {

    @Test
    @DisplayName("plano -> professor -> aluno -> mensalidades -> ficha -> avaliacao -> painel")
    void fluxoDaApresentacao() throws Exception {

        long plano = criarPlano("Bimestral Demo " + proximo(), 119.90, 2);

        long prof = criarProfessor();

        long aluno = criarAluno(plano);
        getUrl("/api/alunos/" + aluno)
                .andExpect(jsonPath("$.planoId").value((int) plano))
                .andExpect(jsonPath("$.inadimplente").value(false));

        getUrl("/api/mensalidades?alunoId=" + aluno).andExpect(jsonPath("$.length()").value(2));
        long primeira = ((Number) ler(getUrl("/api/mensalidades?alunoId=" + aluno), "$[0].id")).longValue();
        patchJson("/api/mensalidades/" + primeira + "/pagar", mapa("formaPagamento", "PIX"))
                .andExpect(jsonPath("$.status").value("PAGA"));

        long ficha = criarFicha(aluno, prof, "Adaptacao", LocalDate.now(), LocalDate.now().plusMonths(1),
                List.of(exercicio("Supino", 3, "12"), exercicio("Agachamento", 3, "12")));

        registrarAvaliacao(aluno, prof, LocalDate.now().minusDays(30), 85, 1.78, 24).andExpect(status().isCreated());
        registrarAvaliacao(aluno, prof, LocalDate.now(), 82, 1.78, 21).andExpect(status().isCreated());

        getUrl("/api/fichas?alunoId=" + aluno).andExpect(jsonPath("$[0].id").value((int) ficha));
        getUrl("/api/avaliacoes/evolucao/" + aluno)
                .andExpect(jsonPath("$.totalAvaliacoes").value(2))
                .andExpect(jsonPath("$.variacaoPeso").value(-3.0));

        getUrl("/api/dashboard")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.alunosAtivos").isNumber())
                .andExpect(jsonPath("$.professoresAtivos").isNumber())
                .andExpect(jsonPath("$.recebidoNoMes").isNumber());

        deleteUrl("/api/planos/" + plano).andExpect(status().isUnprocessableEntity());
        deleteUrl("/api/professores/" + prof).andExpect(status().isUnprocessableEntity());

        deleteUrl("/api/alunos/" + aluno).andExpect(status().isNoContent());
        getUrl("/api/mensalidades?alunoId=" + aluno).andExpect(jsonPath("$").isEmpty());
        getUrl("/api/fichas?alunoId=" + aluno).andExpect(jsonPath("$").isEmpty());
        getUrl("/api/avaliacoes?alunoId=" + aluno).andExpect(jsonPath("$").isEmpty());
        deleteUrl("/api/professores/" + prof).andExpect(status().isNoContent());
        deleteUrl("/api/planos/" + plano).andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("front-end e servido pelo Spring (integracao front + back)")
    void frontEndServido() throws Exception {
        getUrl("/").andExpect(status().isOk());
        getUrl("/js/api.js").andExpect(status().isOk());
        getUrl("/css/style.css").andExpect(status().isOk());
    }
}
