package br.senac.fullstack.matching.application.service;

import br.senac.fullstack.descoberta.api.mapper.DescobertaMapper;
import br.senac.fullstack.descoberta.domain.FiltrosDescoberta;
import br.senac.fullstack.matching.api.dto.RecomendacaoResponse;
import br.senac.fullstack.matching.api.dto.RecomendacoesResponse;
import br.senac.fullstack.matching.api.dto.RecomendacoesResponse.Pendencia;
import br.senac.fullstack.matching.api.dto.RelatorioMatchingResponse;
import br.senac.fullstack.matching.domain.CandidatoMatching;
import br.senac.fullstack.matching.domain.PerfilMatching;
import br.senac.fullstack.matching.domain.RegraMentoria;
import br.senac.fullstack.matching.infrastructure.query.MatchingQueryRepository;
import br.senac.fullstack.perfilmatch.infrastructure.persistence.repository.PerfilMatchRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.shared.security.ResourceAccess;
import br.senac.fullstack.startup.application.service.AptidaoPublicacaoStartupService;
import br.senac.fullstack.startup.domain.enums.StatusPerfilStartup;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public class MatchingService {
    private final MatchingQueryRepository origens;
    private final PerfilMatchRepository questionarios;
    private final MatchingSnapshotService retratos;
    private final AptidaoPublicacaoStartupService aptidao;
    private final DescobertaMapper mapper;
    private final ResourceAccess access;
    private final Clock clock;

    public MatchingService(MatchingQueryRepository origens,
            PerfilMatchRepository questionarios, MatchingSnapshotService retratos,
            AptidaoPublicacaoStartupService aptidao, DescobertaMapper mapper, ResourceAccess access,
            @Qualifier("matchingClock") Clock clock) {
        this.origens = origens;
        this.questionarios = questionarios;
        this.retratos = retratos;
        this.aptidao = aptidao;
        this.mapper = mapper;
        this.access = access;
        this.clock = clock;
    }

    public RecomendacoesResponse paraStartup(UUID id, Map<String, List<String>> parametros) {
        access.currentStartupUserId();
        var startup = origens.startup(id);
        access.requireStartupMember(startup);
        validarParametros(parametros);
        var quiz = questionarios.findByStartupId(id).orElse(null);
        var origem = retratos.preparar(quiz, TipoUsuario.STARTUP);
        List<Pendencia> pendencias = new ArrayList<>();
        if (startup.getStatus() != StatusPerfilStartup.PUBLICADO) {
            pendencias.add(new Pendencia("status", "Publique o perfil da startup."));
        }
        aptidao.avaliar(startup, quiz).forEach(item -> pendencias.add(new Pendencia(item.campo(), item.mensagem())));
        return listar(id, TipoUsuario.STARTUP, origem, pendencias);
    }

    public Map<String, String> evidenciasIndicacao(UUID startupId, UUID mentorId) {
        var indicacao = paraStartup(startupId, Map.of()).itens().stream()
                .filter(item -> item.perfil().id().equals(mentorId)).findFirst().orElseThrow();
        var startup = publicado(TipoUsuario.STARTUP, startupId).dados();
        Map<String, String> evidencias = new LinkedHashMap<>();
        startup.topicos().stream().filter(indicacao.perfil().topicos()::contains).forEach(topico ->
                evidencias.put(topico.name(), "A startup procura mentoria neste tópico público do mentor: " + topico.name()));
        if (indicacao.agendaEmComum()) {
            evidencias.put("AGENDA", "As fichas declaram ao menos um dia e período em comum.");
        }
        return Map.copyOf(evidencias);
    }

    public RecomendacoesResponse paraMentor(Map<String, List<String>> parametros) {
        var mentor = origens.mentorDaConta(access.currentMentorUserId());
        validarParametros(parametros);
        var quiz = questionarios.findByMentorId(mentor.getId()).orElse(null);
        var origem = retratos.preparar(quiz, TipoUsuario.MENTOR);
        List<Pendencia> pendencias = new ArrayList<>();
        if (mentor.getStatus() != br.senac.fullstack.mentor.domain.enums.StatusPerfilMentor.PUBLICADO) {
            pendencias.add(new Pendencia("status", "Publique o perfil de mentor."));
        }
        if (quiz == null) {
            pendencias.add(new Pendencia("perfilMatch", "Preencha e salve o questionário de mentor."));
        } else if (!quiz.isAccepting()) {
            pendencias.add(new Pendencia("accepting", "Ative o recebimento de novas startups no questionário."));
        }
        return listar(mentor.getId(), TipoUsuario.MENTOR, origem, pendencias);
    }

    public RelatorioMatchingResponse relatorio(UUID startupId, UUID mentorId, Map<String, List<String>> parametros) {
        access.requireAdmin();
        validarParametros(parametros);
        PerfilMatching startup = publicado(TipoUsuario.STARTUP, startupId);
        PerfilMatching mentor = publicado(TipoUsuario.MENTOR, mentorId);
        var resultado = RegraMentoria.calcular(startup.dados(), mentor.dados());
        return new RelatorioMatchingResponse(RegraMentoria.VERSAO, clock.instant(), fonte(startup), fonte(mentor),
                resultado, resultado.elegivel(), resultado.indicado(), resultado.superDamatch());
    }

    private RecomendacoesResponse listar(UUID id, TipoUsuario tipo, Optional<PerfilMatching> origem,
            List<Pendencia> pendencias) {
        if (origem.isEmpty()) {
            if (pendencias.isEmpty()) {
                pendencias.add(new Pendencia("perfilMatch", "Revise cadastro, agenda e questionário completos."));
            }
            return new RecomendacoesResponse(id, tipo, RegraMentoria.VERSAO, clock.instant(), false,
                    List.copyOf(pendencias), List.of());
        }
        TipoUsuario destino = tipo == TipoUsuario.STARTUP ? TipoUsuario.MENTOR : TipoUsuario.STARTUP;
        List<RecomendacaoResponse> itens = candidatos(destino).stream().map(candidato -> {
            PerfilMatching startup = tipo == TipoUsuario.STARTUP ? origem.get() : candidato;
            PerfilMatching mentor = tipo == TipoUsuario.MENTOR ? origem.get() : candidato;
            return new CandidatoMatching(candidato, RegraMentoria.calcular(startup.dados(), mentor.dados()));
        }).filter(item -> item.resultado().indicado()).sorted(CandidatoMatching.ordem()).limit(20)
                .map(item -> new RecomendacaoResponse(mapper.toResponse(item.perfil().perfil()),
                        item.resultado().superDamatch(), item.resultado().agendaEmComum())).toList();
        return new RecomendacoesResponse(id, tipo, RegraMentoria.VERSAO, clock.instant(), true, List.of(), itens);
    }

    private List<PerfilMatching> candidatos(TipoUsuario tipo) {
        return origens.publicados(tipo, null).stream()
                .map(quiz -> retratos.preparar(quiz, tipo)).flatMap(Optional::stream).toList();
    }

    private PerfilMatching publicado(TipoUsuario tipo, UUID id) {
        return origens.publicados(tipo, id).stream()
                .map(quiz -> retratos.preparar(quiz, tipo)).flatMap(Optional::stream)
                .findFirst().orElseThrow(NoSuchElementException::new);
    }

    private RelatorioMatchingResponse.Fonte fonte(PerfilMatching perfil) {
        return new RelatorioMatchingResponse.Fonte(perfil.perfil().id(), perfil.questionarioAtualizadoEm(),
                perfil.revisao(), perfil.dados());
    }

    private void validarParametros(Map<String, List<String>> parametros) {
        FiltrosDescoberta.validarParametros(parametros, Set.of());
    }
}
