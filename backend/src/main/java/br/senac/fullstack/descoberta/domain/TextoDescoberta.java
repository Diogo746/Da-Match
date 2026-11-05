package br.senac.fullstack.descoberta.domain;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

public final class TextoDescoberta {
    private static final Pattern MARCAS = Pattern.compile("\\p{M}+");

    private TextoDescoberta() { }

    public static String normalizar(String texto) {
        return MARCAS.matcher(Normalizer.normalize(texto, Normalizer.Form.NFD))
                .replaceAll("").toLowerCase(Locale.ROOT).strip();
    }
}
