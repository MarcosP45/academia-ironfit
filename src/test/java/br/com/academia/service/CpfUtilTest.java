package br.com.academia.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class CpfUtilTest {

    @Test
    void aceitaCpfValidoComOuSemMascara() {
        assertTrue(CpfUtil.isValido("526.018.159-06"));
        assertTrue(CpfUtil.isValido("52601815906"));
    }

    @Test
    void rejeitaCpfInvalido() {
        assertFalse(CpfUtil.isValido("526.018.159-07"));
        assertFalse(CpfUtil.isValido("111.111.111-11"));
        assertFalse(CpfUtil.isValido("123"));
        assertFalse(CpfUtil.isValido(null));
    }

    @Test
    void formataCpf() {
        assertEquals("526.018.159-06", CpfUtil.formatar("52601815906"));
    }
}
