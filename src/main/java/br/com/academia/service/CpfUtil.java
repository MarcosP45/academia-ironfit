package br.com.academia.service;

public final class CpfUtil {

    private CpfUtil() {
    }

    public static String somenteNumeros(String cpf) {
        return cpf == null ? "" : cpf.replaceAll("\\D", "");
    }

    public static boolean isValido(String cpf) {
        String n = somenteNumeros(cpf);
        if (n.length() != 11 || n.chars().distinct().count() == 1) {
            return false;
        }
        return digito(n, 9) == n.charAt(9) - '0' && digito(n, 10) == n.charAt(10) - '0';
    }

    private static int digito(String n, int tamanho) {
        int soma = 0;
        for (int i = 0; i < tamanho; i++) {
            soma += (n.charAt(i) - '0') * (tamanho + 1 - i);
        }
        int resto = (soma * 10) % 11;
        return resto == 10 ? 0 : resto;
    }

    public static String formatar(String cpf) {
        String n = somenteNumeros(cpf);
        if (n.length() != 11) return cpf;
        return n.substring(0, 3) + "." + n.substring(3, 6) + "." + n.substring(6, 9) + "-" + n.substring(9);
    }
}
