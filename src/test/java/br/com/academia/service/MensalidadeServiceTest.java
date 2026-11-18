package br.com.academia.service;

import br.com.academia.model.Mensalidade;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MensalidadeServiceTest {

    private final MensalidadeService service = new MensalidadeService(null, null);

    private Mensalidade mensalidade(String valor, LocalDate vencimento) {
        Mensalidade m = new Mensalidade();
        m.setValor(new BigDecimal(valor));
        m.setDataVencimento(vencimento);
        return m;
    }

    @Test
    void semEncargosQuandoPagaEmDia() {
        LocalDate venc = LocalDate.of(2026, 11, 10);
        Mensalidade m = mensalidade("100.00", venc);
        assertEquals(new BigDecimal("100.00"), service.calcularValorAtualizado(m, venc));
        assertEquals(new BigDecimal("100.00"), service.calcularValorAtualizado(m, venc.minusDays(3)));
    }

    @Test
    void aplicaMultaDe2PorcentoMaisJurosProRata() {
        LocalDate venc = LocalDate.of(2026, 11, 10);
        Mensalidade m = mensalidade("100.00", venc);
        assertEquals(new BigDecimal("103.00"), service.calcularValorAtualizado(m, venc.plusDays(30)));
        assertEquals(new BigDecimal("102.50"), service.calcularValorAtualizado(m, venc.plusDays(15)));
    }
}
