package br.senac.fullstack.matching.domain;

import br.senac.fullstack.matching.domain.ResultadoMatching.Contribuicoes;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Experiencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formacao;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formato;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Frequencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Publico;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Setor;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Topico;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public final class RegraMentoria {
    public static final String VERSAO = "damatch-mentoria-v1";
    public static final BigDecimal CORTE = BigDecimal.valueOf(60);
    public static final BigDecimal SELO = BigDecimal.valueOf(95);
    private static final BigDecimal CONHECIMENTO = new BigDecimal("0.7");

    private RegraMentoria() { }

    public static ResultadoMatching calcular(DadosMatching startup, DadosMatching mentor) {
        int atendidas = (int) startup.topicos().stream().filter(mentor.topicos()::contains).count();
        int praticas = (int) startup.topicos().stream()
                .filter(mentor.topicos()::contains)
                .filter(topico -> mentor.experiencias().get(topico) == Experiencia.PRACTICAL).count();
        boolean agenda = startup.agenda().stream().anyMatch(mentor.agenda()::contains);
        List<String> impedimentos = impedimentos(startup, mentor, atendidas);
        if (!impedimentos.isEmpty()) {
            return new ResultadoMatching(impedimentos, null, null, atendidas, praticas, agenda);
        }
        Contribuicoes pontos = new Contribuicoes(necessidades(startup.topicos(), mentor), setor(startup, mentor),
                pontos(mentor.momentos().contains(startup.momentos().getFirst()), 10),
                pontos(!startup.publicos().contains(Publico.UNKNOWN)
                        && startup.publicos().stream().anyMatch(mentor.publicos()::contains), 10),
                pontos(agenda, 10), pontos(formacaoComplementar(startup, mentor), 5));
        return new ResultadoMatching(List.of(), pontos.total(), pontos, atendidas, praticas, agenda);
    }

    private static List<String> impedimentos(DadosMatching startup, DadosMatching mentor, int atendidas) {
        List<String> motivos = new ArrayList<>();
        if (atendidas == 0) {
            motivos.add("SEM_NECESSIDADE_ATENDIDA");
        }
        boolean online = startup.formato() != Formato.PRESENCIAL && mentor.formato() != Formato.PRESENCIAL;
        boolean presencial = startup.formato() != Formato.ONLINE && mentor.formato() != Formato.ONLINE
                && !startup.cidadeId().isBlank() && startup.cidadeId().equals(mentor.cidadeId());
        if (!online && !presencial) {
            motivos.add("MODALIDADE_INCOMPATIVEL");
        }
        if (startup.frequencia() != mentor.frequencia() && startup.frequencia() != Frequencia.FLEXIBLE
                && mentor.frequencia() != Frequencia.FLEXIBLE) {
            motivos.add("FREQUENCIA_INCOMPATIVEL");
        }
        return motivos;
    }

    private static BigDecimal necessidades(List<Topico> topicos, DadosMatching mentor) {
        if (topicos.size() == 1) {
            return assunto(topicos.getFirst(), mentor, 50);
        }
        return assunto(topicos.getFirst(), mentor, 35).add(assunto(topicos.get(1), mentor, 15));
    }

    private static BigDecimal assunto(Topico topico, DadosMatching mentor, int peso) {
        if (!mentor.topicos().contains(topico)) {
            return BigDecimal.ZERO;
        }
        Experiencia experiencia = mentor.experiencias().get(topico);
        if (experiencia == Experiencia.PRACTICAL) {
            return BigDecimal.valueOf(peso);
        }
        return experiencia == Experiencia.KNOWLEDGE ? BigDecimal.valueOf(peso).multiply(CONHECIMENTO) : BigDecimal.ZERO;
    }

    private static BigDecimal setor(DadosMatching startup, DadosMatching mentor) {
        if (startup.setores().contains(Setor.DISCOVERING)) {
            return BigDecimal.ZERO;
        }
        if (startup.setores().stream().anyMatch(mentor.setores()::contains)) {
            return BigDecimal.valueOf(15);
        }
        return mentor.setores().contains(Setor.GENERAL) ? new BigDecimal("7.5") : BigDecimal.ZERO;
    }

    private static boolean formacaoComplementar(DadosMatching startup, DadosMatching mentor) {
        List<Formacao> time = especificas(startup.formacoes());
        List<Formacao> orientador = especificas(mentor.formacoes());
        return !time.isEmpty() && orientador.stream().anyMatch(area -> !time.contains(area));
    }

    private static List<Formacao> especificas(List<Formacao> areas) {
        return areas.stream().filter(area -> area != Formacao.OTHER && area != Formacao.STUDENT).toList();
    }

    private static BigDecimal pontos(boolean corresponde, int peso) {
        return corresponde ? BigDecimal.valueOf(peso) : BigDecimal.ZERO;
    }
}
