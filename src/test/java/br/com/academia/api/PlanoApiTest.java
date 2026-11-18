package br.com.academia.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Planos")
class PlanoApiTest extends AbstractApiTest {

    @Test
    @DisplayName("cadastra plano e calcula o valor total do contrato (mensal x meses)")
    void cadastraComValorTotal() throws Exception {
        postJson("/api/planos", mapa("nome", "Bimestral " + proximo(), "valorMensal", 119.90, "duracaoMeses", 2))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.valorTotal").value(239.80))
                .andExpect(jsonPath("$.ativo").value(true))
                .andExpect(jsonPath("$.quantidadeAlunos").value(0));
    }

    @Test
    @DisplayName("edita o plano")
    void edita() throws Exception {
        long id = criarPlano("Plano Editavel " + proximo(), 100, 1);
        putJson("/api/planos/" + id, mapa("nome", "Plano Renomeado " + proximo(), "valorMensal", 150.0, "duracaoMeses", 3))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valorTotal").value(450.0));
    }

    @Test
    @DisplayName("inativar tira o plano da lista de ativos, mas ele continua na lista geral")
    void inativa() throws Exception {
        long id = criarPlanoUnico(1);
        patchJson("/api/planos/" + id + "/status?ativo=false", null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.ativo").value(false));

        getUrl("/api/planos?ativos=true").andExpect(jsonPath("$[*].id").value(not(hasItem((int) id))));
        getUrl("/api/planos").andExpect(jsonPath("$[*].id").value(hasItem((int) id)));
    }

    @Test
    @DisplayName("nao permite aluno novo em plano inativo (422)")
    void planoInativoNaoAceitaAluno() throws Exception {
        long plano = criarPlanoUnico(1);
        patchJson("/api/planos/" + plano + "/status?ativo=false", null).andExpect(status().isOk());
        postJson("/api/alunos", mapa("nome", "Aluno Plano Inativo", "cpf", cpfValido(), "email", "a@email.com",
                "telefone", "(24) 90000-0000", "planoId", plano))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("exclui plano sem alunos")
    void excluiSemAlunos() throws Exception {
        long id = criarPlanoUnico(1);
        deleteUrl("/api/planos/" + id).andExpect(status().isNoContent());
        getUrl("/api/planos/" + id).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("bloqueia a exclusao de plano que tem alunos vinculados (422)")
    void bloqueiaExclusaoComAlunos() throws Exception {
        long plano = criarPlanoUnico(1);
        criarAluno(plano);
        deleteUrl("/api/planos/" + plano)
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.mensagem").value(containsString("aluno(s) vinculado(s)")));
        getUrl("/api/planos").andExpect(jsonPath("$[?(@.id==" + plano + ")].quantidadeAlunos").value(hasItem(1)));
    }

    @Test
    @DisplayName("nome de plano duplicado e rejeitado (422)")
    void nomeDuplicado() throws Exception {
        String nome = "Plano Duplicado " + proximo();
        criarPlano(nome, 100, 1);
        postJson("/api/planos", mapa("nome", nome, "valorMensal", 100.0, "duracaoMeses", 1))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("validacao: valor zero e duracao fora do intervalo (400)")
    void validacao() throws Exception {
        postJson("/api/planos", mapa("nome", "Plano Invalido", "valorMensal", 0, "duracaoMeses", 99))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.valorMensal").exists())
                .andExpect(jsonPath("$.campos.duracaoMeses").exists());
    }
}
