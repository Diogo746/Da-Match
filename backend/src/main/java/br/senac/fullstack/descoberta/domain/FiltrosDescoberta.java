package br.senac.fullstack.descoberta.domain;

import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formato;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Setor;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Topico;
import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
import br.senac.fullstack.shared.enums.TipoUsuario;

import java.util.List;
import java.util.Map;
import java.util.Set;

public record FiltrosDescoberta(String busca, Setor setor, Topico topico, Formato formato,
        String cidade, int pagina, int tamanho) {
    private static final Set<String> CAMPOS = Set.of("busca", "setor", "topico", "formato", "cidade", "pagina", "tamanho");

    public static FiltrosDescoberta ler(Map<String, List<String>> parametros, TipoUsuario tipo) {
        validarParametros(parametros, CAMPOS);
        String busca = valor(parametros, "busca");
        if (busca.length() > 100) {
            throw new IllegalArgumentException("Busca muito longa.");
        }
        Setor setor = codigo(Setor.class, valor(parametros, "setor"));
        validarSetor(setor, tipo);
        String cidade = valor(parametros, "cidade");
        if (!cidade.isEmpty() && !PerfilMatch.cidadeConhecida(cidade)) {
            throw new IllegalArgumentException("Cidade inválida.");
        }
        int pagina = numero(parametros, "pagina", 0);
        int tamanho = numero(parametros, "tamanho", 20);
        if (pagina < 0 || tamanho < 1 || tamanho > 20) {
            throw new IllegalArgumentException("Página inválida.");
        }
        return new FiltrosDescoberta(TextoDescoberta.normalizar(busca), setor,
                codigo(Topico.class, valor(parametros, "topico")),
                codigo(Formato.class, valor(parametros, "formato")), cidade, pagina, tamanho);
    }

    public static void validarParametros(Map<String, List<String>> parametros, Set<String> permitidos) {
        if (parametros == null || parametros.entrySet().stream().anyMatch(entry -> !permitidos.contains(entry.getKey())
                || entry.getValue() == null || entry.getValue().size() != 1 || entry.getValue().getFirst() == null)) {
            throw new IllegalArgumentException("Parâmetros inválidos.");
        }
    }

    private static void validarSetor(Setor setor, TipoUsuario tipo) {
        if (tipo == TipoUsuario.MENTOR && setor == Setor.DISCOVERING
                || tipo == TipoUsuario.STARTUP && setor == Setor.GENERAL) {
            throw new IllegalArgumentException("Setor incompatível.");
        }
    }

    private static String valor(Map<String, List<String>> parametros, String campo) {
        return parametros.containsKey(campo) ? parametros.get(campo).getFirst().strip() : "";
    }

    private static int numero(Map<String, List<String>> parametros, String campo, int padrao) {
        return parametros.containsKey(campo) ? Integer.parseInt(valor(parametros, campo)) : padrao;
    }

    private static <T extends Enum<T>> T codigo(Class<T> tipo, String valor) {
        return valor.isEmpty() ? null : Enum.valueOf(tipo, valor);
    }

    public boolean inclui(PerfilDescoberta perfil) {
        return busca.isEmpty() || TextoDescoberta.normalizar(perfil.nome()).contains(busca)
                || TextoDescoberta.normalizar(perfil.apresentacao()).contains(busca);
    }
}
