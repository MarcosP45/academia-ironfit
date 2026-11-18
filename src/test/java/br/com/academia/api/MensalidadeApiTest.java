package br.com.academia.api;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Mensalidades")
class MensalidadeApiTest extends AbstractApiTest {

    private long lancarAvulsa(long alunoId, LocalDate vencimento) throws Exception {
        return id(postJson("/api/mensalidades", mapa("alunoId", alunoId, "valor", 100.00,
                "dataVencimento", vencimento, "descricao", "Avulsa"))
                .andExpect(status().isCreated()));
    }

    @Test
    @DisplayName("cadastrar aluno em plano trimestral gera 3 mensalidades pendentes")
    void geraMensalidadesNoCadastro() throws Exception {
        long plano = criarPlanoUnico(3);
        long aluno = criarAluno(plano);

        getUrl("/api/mensalidades?alunoId=" + aluno)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].status").value("PENDENTE"))
                .andExpect(jsonPath("$[0].valor").value(100.0));
    }

    @Test
    @DisplayName("pagar muda a situacao para PAGA e registra forma de pagamento")
    void pagaEmDia() throws Exception {
        long aluno = criarAluno(null);
        long m = lancarAvulsa(aluno, LocalDate.now().plusDays(10));

        patchJson("/api/mensalidades/" + m + "/pagar", mapa("formaPagamento", "PIX"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAGA"))
                .andExpect(jsonPath("$.formaPagamento").value("PIX"))
                .andExpect(jsonPath("$.valorPago").value(100.0));
    }

    @Test
    @DisplayName("pagamento em atraso (30 dias) cobra multa de 2% + juros de 1% = R$ 103,00")
    void pagaComMultaEJuros() throws Exception {
        long aluno = criarAluno(null);
        long m = lancarAvulsa(aluno, LocalDate.now().minusDays(30));

        patchJson("/api/mensalidades/" + m + "/pagar",
                mapa("dataPagamento", LocalDate.now(), "formaPagamento", "DINHEIRO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAGA"))
                .andExpect(jsonPath("$.valorPago").value(103.0));
    }

    @Test
    @DisplayName("pendente com vencimento passado aparece como ATRASADA e entra no filtro")
    void situacaoAtrasada() throws Exception {
        long aluno = criarAluno(null);
        long m = lancarAvulsa(aluno, LocalDate.now().minusDays(5));

        getUrl("/api/mensalidades?alunoId=" + aluno)
                .andExpect(jsonPath("$[0].situacao").value("ATRASADA"))
                .andExpect(jsonPath("$[0].diasAtraso").value(5));
        getUrl("/api/mensalidades?situacao=ATRASADA").andExpect(jsonPath("$[*].id").value(hasItem((int) m)));
        getUrl("/api/alunos/" + aluno).andExpect(jsonPath("$.inadimplente").value(true));
    }

    @Test
    @DisplayName("estornar devolve a mensalidade para PENDENTE e limpa os dados do pagamento")
    void estorna() throws Exception {
        long aluno = criarAluno(null);
        long m = lancarAvulsa(aluno, LocalDate.now().plusDays(10));
        patchJson("/api/mensalidades/" + m + "/pagar", mapa("formaPagamento", "PIX")).andExpect(status().isOk());

        patchJson("/api/mensalidades/" + m + "/estornar", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.dataPagamento").doesNotExist())
                .andExpect(jsonPath("$.valorPago").doesNotExist());
    }

    @Test
    @DisplayName("cancelar mensalidade pendente; nao permite pagar depois")
    void cancela() throws Exception {
        long aluno = criarAluno(null);
        long m = lancarAvulsa(aluno, LocalDate.now().plusDays(10));

        patchJson("/api/mensalidades/" + m + "/cancelar", null)
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("CANCELADA"));
        patchJson("/api/mensalidades/" + m + "/pagar", mapa("formaPagamento", "PIX"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("nao paga duas vezes, nao estorna pendente e nao exclui mensalidade paga (422)")
    void regrasDeStatus() throws Exception {
        long aluno = criarAluno(null);
        long m = lancarAvulsa(aluno, LocalDate.now().plusDays(10));

        patchJson("/api/mensalidades/" + m + "/estornar", null).andExpect(status().isUnprocessableEntity());

        patchJson("/api/mensalidades/" + m + "/pagar", mapa("formaPagamento", "PIX")).andExpect(status().isOk());
        patchJson("/api/mensalidades/" + m + "/pagar", mapa("formaPagamento", "PIX"))
                .andExpect(status().isUnprocessableEntity());
        deleteUrl("/api/mensalidades/" + m).andExpect(status().isUnprocessableEntity());

        patchJson("/api/mensalidades/" + m + "/estornar", null).andExpect(status().isOk());
        deleteUrl("/api/mensalidades/" + m).andExpect(status().isNoContent());
        getUrl("/api/mensalidades/" + m).andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("gerar continua a partir da ultima mensalidade, sem duplicar vencimentos")
    void geraSemDuplicar() throws Exception {
        long plano = criarPlanoUnico(1);
        long aluno = criarAluno(plano);
        getUrl("/api/mensalidades?alunoId=" + aluno).andExpect(jsonPath("$.length()").value(1));

        postJson("/api/mensalidades/gerar", mapa("alunoId", aluno, "quantidade", 2))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.length()").value(2));
        getUrl("/api/mensalidades?alunoId=" + aluno).andExpect(jsonPath("$.length()").value(3));

        LocalDate primeiro = LocalDate.now();
        postJson("/api/mensalidades/gerar", mapa("alunoId", aluno, "quantidade", 1, "primeiroVencimento", primeiro))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("lancamento avulso duplicado no mesmo vencimento e rejeitado")
    void avulsaDuplicada() throws Exception {
        long aluno = criarAluno(null);
        LocalDate venc = LocalDate.now().plusDays(20);
        lancarAvulsa(aluno, venc);
        postJson("/api/mensalidades", mapa("alunoId", aluno, "valor", 100.0, "dataVencimento", venc))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("validacao: forma de pagamento obrigatoria e valor positivo (400)")
    void validacao() throws Exception {
        long aluno = criarAluno(null);
        long m = lancarAvulsa(aluno, LocalDate.now().plusDays(3));

        patchJson("/api/mensalidades/" + m + "/pagar", mapa("dataPagamento", LocalDate.now()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.campos.formaPagamento").exists());
        postJson("/api/mensalidades", mapa("alunoId", aluno, "valor", 0, "dataVencimento", LocalDate.now()))
                .andExpect(status().isBadRequest());
    }
}
