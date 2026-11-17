package br.senac.fullstack.matching.domain;

import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Dia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Experiencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formacao;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formato;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Frequencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Momento;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Periodo;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Publico;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Setor;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Topico;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.List;
import java.util.Map;
import java.util.function.Consumer;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

class RegraMentoriaTest {
    static class Perfil {
        List<Momento> momentos = List.of(Momento.PROBLEM);
        List<Setor> setores = List.of(Setor.TECH);
        List<Topico> topicos = List.of(Topico.VALIDATION, Topico.BUSINESS);
        Map<Topico, Experiencia> experiencias = Map.of(Topico.VALIDATION, Experiencia.PRACTICAL,
                Topico.BUSINESS, Experiencia.PRACTICAL);
        List<Publico> publicos = List.of(Publico.B2B);
        List<Formacao> formacoes = List.of(Formacao.TECH);
        Formato formato = Formato.ONLINE;
        String cidade = "";
        List<DadosMatching.Janela> agenda = List.of(new DadosMatching.Janela(Dia.THU, Periodo.EVENING));
        Frequencia frequencia = Frequencia.MONTHLY;

        DadosMatching dados() {
            return new DadosMatching(momentos, setores, topicos, experiencias, publicos, formacoes,
                    formato, cidade, agenda, frequencia);
        }
    }

    static class Par {
        Perfil startup = new Perfil();
        Perfil mentor = new Perfil();

        Par() {
            startup.formacoes = List.of(Formacao.BUSINESS);
            startup.experiencias = Map.of();
        }

        ResultadoMatching calcular() {
            return RegraMentoria.calcular(startup.dados(), mentor.dados());
        }
    }

    static Stream<Arguments> exemplos() {
        return Stream.of(
                exemplo("completo", p -> { }, "100"),
                exemplo("sem complemento", p -> p.mentor.formacoes = List.of(Formacao.BUSINESS), "95"),
                exemplo("sem agenda", p -> p.mentor.agenda = List.of(new DadosMatching.Janela(Dia.MON, Periodo.MORNING)), "90"),
                exemplo("geral", p -> p.mentor.setores = List.of(Setor.GENERAL), "92.5"),
                exemplo("descobrindo", p -> p.startup.setores = List.of(Setor.DISCOVERING), "85"),
                exemplo("publico desconhecido", p -> p.startup.publicos = List.of(Publico.UNKNOWN), "90"),
                exemplo("so principal pratica", p -> p.mentor.topicos = List.of(Topico.VALIDATION), "85"),
                exemplo("so secundaria pratica", p -> p.mentor.topicos = List.of(Topico.BUSINESS), "65"),
                exemplo("so secundaria conhecimento", p -> {
                    p.mentor.topicos = List.of(Topico.BUSINESS);
                    p.mentor.experiencias = Map.of(Topico.BUSINESS, Experiencia.KNOWLEDGE);
                }, "60.5"),
                exemplo("principal conhecimento", p -> p.mentor.experiencias = Map.of(
                        Topico.VALIDATION, Experiencia.KNOWLEDGE, Topico.BUSINESS, Experiencia.PRACTICAL), "89.5"),
                exemplo("secundaria conhecimento", p -> p.mentor.experiencias = Map.of(
                        Topico.VALIDATION, Experiencia.PRACTICAL, Topico.BUSINESS, Experiencia.KNOWLEDGE), "95.5"),
                exemplo("unica conhecimento", p -> {
                    p.startup.topicos = List.of(Topico.VALIDATION);
                    p.mentor.experiencias = Map.of(Topico.VALIDATION, Experiencia.KNOWLEDGE);
                }, "85"),
                exemplo("corte inclusivo", p -> {
                    p.mentor.topicos = List.of(Topico.VALIDATION);
                    p.startup.publicos = List.of(Publico.UNKNOWN);
                    p.mentor.agenda = List.of(new DadosMatching.Janela(Dia.MON, Periodo.MORNING));
                    p.mentor.formacoes = List.of(Formacao.BUSINESS);
                }, "60"),
                exemplo("abaixo sem arredondar", p -> {
                    p.mentor.experiencias = Map.of(Topico.VALIDATION, Experiencia.KNOWLEDGE,
                            Topico.BUSINESS, Experiencia.PRACTICAL);
                    p.mentor.setores = List.of(Setor.HEALTH);
                    p.startup.publicos = List.of(Publico.UNKNOWN);
                    p.mentor.formacoes = List.of(Formacao.BUSINESS);
                }, "59.5"));
    }

    private static Arguments exemplo(String nome, Consumer<Par> alterar, String total) {
        return Arguments.of(nome, alterar, total);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("exemplos")
    void atendeOsQuatorzeCasosDoGuia29(String nome, Consumer<Par> alterar, String total) {
        Par par = new Par();
        alterar.accept(par);
        ResultadoMatching resultado = par.calcular();
        assertThat(resultado.elegivel()).as(nome).isTrue();
        assertThat(resultado.nota()).isEqualByComparingTo(total);
        assertThat(resultado.contribuicoes().total()).isEqualByComparingTo(total);
        assertThat(resultado.indicado()).isEqualTo(!"59.5".equals(total));
        assertThat(resultado.superDamatch()).isEqualTo(List.of("100", "95", "95.5").contains(total));
    }

    @Test
    void ordemDePrioridadeNaoRedistribuiPontosNemConfundeExperienciaNaoOferecida() {
        Par par = new Par();
        par.mentor.topicos = List.of(Topico.BUSINESS);
        assertThat(par.calcular().nota()).isEqualByComparingTo("65");
        assertThat(par.calcular().necessidadesPraticas()).isEqualTo(1);
        par.startup.topicos = List.of(Topico.BUSINESS, Topico.VALIDATION);
        assertThat(par.calcular().nota()).isEqualByComparingTo("85");
        assertThat(par.calcular().necessidadesAtendidas()).isEqualTo(1);
    }

    @Test
    void desconhecidosTemPrecedenciaSobreGeralESemNormalizacao() {
        Par par = new Par();
        par.startup.setores = List.of(Setor.DISCOVERING);
        par.mentor.setores = List.of(Setor.GENERAL);
        par.startup.publicos = List.of(Publico.UNKNOWN);
        assertThat(par.calcular().nota()).isEqualByComparingTo("75");
    }

    @Test
    void bastaUmaIntersecaoDeSetorEPublicoEAreaAdicional() {
        Par par = new Par();
        par.startup.setores = List.of(Setor.HEALTH, Setor.TECH);
        par.startup.publicos = List.of(Publico.B2C, Publico.B2B);
        par.mentor.formacoes = List.of(Formacao.BUSINESS, Formacao.TECH);
        assertThat(par.calcular().nota()).isEqualByComparingTo("100");
        par.startup.formacoes = List.of(Formacao.STUDENT, Formacao.OTHER);
        assertThat(par.calcular().nota()).isEqualByComparingTo("95");
        par.startup.formacoes = List.of(Formacao.BUSINESS);
        par.mentor.formacoes = List.of(Formacao.OTHER);
        assertThat(par.calcular().nota()).isEqualByComparingTo("95");
    }

    @Test
    void agendaUsaParesExatosSemProdutoCartesianoNemBonusPorQuantidade() {
        Par par = new Par();
        par.startup.agenda = List.of(new DadosMatching.Janela(Dia.MON, Periodo.MORNING),
                new DadosMatching.Janela(Dia.THU, Periodo.EVENING));
        par.mentor.agenda = List.of(new DadosMatching.Janela(Dia.MON, Periodo.EVENING),
                new DadosMatching.Janela(Dia.THU, Periodo.MORNING));
        assertThat(par.calcular().agendaEmComum()).isFalse();
        assertThat(par.calcular().nota()).isEqualByComparingTo("90");
        par.mentor.agenda = par.startup.agenda;
        assertThat(par.calcular().nota()).isEqualByComparingTo("100");
    }

    @Test
    void filtrosDeNecessidadeModalidadeEFrequenciaPrecedemANota() {
        Par par = new Par();
        par.mentor.topicos = List.of(Topico.PITCH);
        par.mentor.formato = Formato.PRESENCIAL;
        par.mentor.cidade = "PE_RECIFE";
        par.mentor.frequencia = Frequencia.WEEKLY;
        assertThat(par.calcular().impedimentos()).containsExactly("SEM_NECESSIDADE_ATENDIDA",
                "MODALIDADE_INCOMPATIVEL", "FREQUENCIA_INCOMPATIVEL");
        assertThat(par.calcular().nota()).isNull();
        assertThat(par.calcular().indicado()).isFalse();
        assertThat(par.calcular().superDamatch()).isFalse();
    }

    @Test
    void ambosPresencialCidadeEFrequenciaFlexivelSeguemContrato() {
        Par par = new Par();
        par.startup.formato = Formato.AMBOS;
        par.mentor.formato = Formato.PRESENCIAL;
        par.mentor.cidade = "PE_RECIFE";
        assertThat(par.calcular().elegivel()).isFalse();
        par.startup.cidade = "PE_RECIFE";
        assertThat(par.calcular().elegivel()).isTrue();
        par.mentor.frequencia = Frequencia.WEEKLY;
        assertThat(par.calcular().elegivel()).isFalse();
        par.startup.frequencia = Frequencia.FLEXIBLE;
        assertThat(par.calcular().elegivel()).isTrue();
        par.startup.formato = Formato.ONLINE;
        par.mentor.formato = Formato.AMBOS;
        par.startup.cidade = "";
        par.mentor.cidade = "PE_OLINDA";
        assertThat(par.calcular().elegivel()).isTrue();
    }
}
