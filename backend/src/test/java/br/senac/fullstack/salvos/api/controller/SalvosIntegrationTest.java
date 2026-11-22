package br.senac.fullstack.salvos.api.controller;

import br.senac.fullstack.auth.infrastructure.security.UsuarioPrincipal;
import br.senac.fullstack.mentor.domain.DisponibilidadeMentor;
import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.mentor.domain.enums.PeriodoDisponibilidade;
import br.senac.fullstack.mentor.domain.enums.StatusPerfilMentor;
import br.senac.fullstack.mentor.infrastructure.persistence.repository.MentorRepository;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Capacidade;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Experiencia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Formacao;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Publico;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Setor;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Topico;
import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
import br.senac.fullstack.perfilmatch.infrastructure.persistence.repository.PerfilMatchRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.startup.domain.enums.StatusPerfilStartup;
import br.senac.fullstack.startup.infrastructure.persistence.repository.StartupRepository;
import br.senac.fullstack.startup.support.PublicacaoStartupFixtures;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:salvos;MODE=PostgreSQL;DB_CLOSE_DELAY=-1")
@AutoConfigureMockMvc
class SalvosIntegrationTest {
    private static final String ROOT = "/api/v1/salvos";
    private static final String ITEM = ROOT + "/{perfilId}";
    private static final String CACHE = "private, no-store";
    private static final Instant ATUALIZADO = Instant.parse("2026-11-22T12:00:00Z");

    @Autowired private MockMvc mvc;
    @Autowired private UsuarioRepository usuarios;
    @Autowired private MentorRepository mentores;
    @Autowired private StartupRepository startups;
    @Autowired private PerfilMatchRepository questionarios;

    @Test
    void salvaUmaVezEIsolaContasInclusiveParaRemover() throws Exception {
        var titular = conta(TipoUsuario.STARTUP);
        var outro = conta(TipoUsuario.STARTUP);
        var id = mentor().getId();
        mvc.perform(put(ITEM, id).with(como(titular)).with(csrf().asHeader())).andExpect(status().isNoContent());
        mvc.perform(put(ITEM, id).with(como(titular)).with(csrf().asHeader())).andExpect(status().isNoContent());
        mvc.perform(get(ROOT).with(como(titular))).andExpect(status().isOk())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, CACHE)).andExpect(jsonPath("$.totalItens").value(1))
                .andExpect(jsonPath("$.itens[0].perfil.id").value(id.toString()))
                .andExpect(jsonPath("$.itens[0].perfil.tipo").value("MENTOR"))
                .andExpect(jsonPath("$.itens[0].perfil.email").doesNotExist());
        mvc.perform(get(ITEM, id).with(como(outro))).andExpect(jsonPath("$.salvo").value(false));
        mvc.perform(delete(ITEM, id).with(como(outro)).with(csrf().asHeader())).andExpect(status().isNoContent());
        mvc.perform(get(ITEM, id).with(como(titular))).andExpect(jsonPath("$.salvo").value(true));
        mvc.perform(delete(ITEM, id).with(como(titular)).with(csrf().asHeader())).andExpect(status().isNoContent());
        mvc.perform(delete(ITEM, id).with(como(titular)).with(csrf().asHeader())).andExpect(status().isNoContent());
        mvc.perform(get(ROOT).with(como(titular))).andExpect(jsonPath("$.itens").isEmpty());
    }

    @Test
    void respeitaPapelCsrfParametrosETipoDoDestino() throws Exception {
        var titular = conta(TipoUsuario.STARTUP);
        var id = mentor().getId();
        mvc.perform(get(ROOT)).andExpect(status().isUnauthorized())
                .andExpect(header().string(HttpHeaders.CACHE_CONTROL, CACHE));
        mvc.perform(get(ROOT).with(como(conta(TipoUsuario.ADMIN)))).andExpect(status().isForbidden());
        mvc.perform(put(ITEM, id).with(como(titular))).andExpect(status().isForbidden());
        mvc.perform(delete(ITEM, id).with(como(titular))).andExpect(status().isForbidden());
        mvc.perform(put(ITEM, id).with(como(titular)).with(csrf().asHeader()).param("usuarioId", "forjado"))
                .andExpect(status().isBadRequest());
        mvc.perform(get(ROOT).with(como(titular)).param("pagina", "2147483647").param("tamanho", "20"))
                .andExpect(status().isBadRequest());
        mvc.perform(put(ITEM, id).with(como(conta(TipoUsuario.MENTOR))).with(csrf().asHeader()))
                .andExpect(status().isNotFound());
        mvc.perform(get(ROOT).with(como(titular))).andExpect(jsonPath("$.itens").isEmpty());
    }

    @Test
    void mantemEntradaRemovivelSemDadosDePerfilPausado() throws Exception {
        var titular = conta(TipoUsuario.STARTUP);
        var mentor = mentor();
        var id = mentor.getId();
        mvc.perform(put(ITEM, id).with(como(titular)).with(csrf().asHeader())).andExpect(status().isNoContent());
        mentor.setStatus(StatusPerfilMentor.PAUSADO);
        mentores.save(mentor);
        mvc.perform(get(ROOT).with(como(titular))).andExpect(jsonPath("$.itens[0].perfilId").value(id.toString()))
                .andExpect(jsonPath("$.itens[0].perfil").doesNotExist());
        mvc.perform(put(ITEM, id).with(como(conta(TipoUsuario.STARTUP))).with(csrf().asHeader())).andExpect(status().isNotFound());
        mvc.perform(delete(ITEM, id).with(como(titular)).with(csrf().asHeader())).andExpect(status().isNoContent());
    }

    @Test
    void mentorPodeSalvarStartupPublicadaEPaginar() throws Exception {
        var titular = conta(TipoUsuario.MENTOR);
        var perfil = PublicacaoStartupFixtures.projeto();
        perfil.setStatus(StatusPerfilStartup.PUBLICADO);
        perfil = startups.save(perfil);
        PerfilMatch quiz = PublicacaoStartupFixtures.questionario();
        quiz.setStartup(perfil);
        quiz.setUpdatedAt(ATUALIZADO);
        questionarios.save(quiz);
        mvc.perform(put(ITEM, perfil.getId()).with(como(titular)).with(csrf().asHeader())).andExpect(status().isNoContent());
        mvc.perform(get(ROOT).param("tamanho", "1").with(como(titular)))
                .andExpect(jsonPath("$.itens[0].perfil.tipo").value("STARTUP")).andExpect(jsonPath("$.totalPaginas").value(1));
        mvc.perform(get(ROOT).param("pagina", "1").with(como(titular))).andExpect(jsonPath("$.itens").isEmpty());
    }

    @Test
    void aceitaGravacoesConcorrentesSemDuplicar() throws Exception {
        var titular = conta(TipoUsuario.STARTUP);
        var id = mentor().getId();
        Callable<Integer> gravar = () -> mvc.perform(put(ITEM, id).with(como(titular)).with(csrf().asHeader()))
                .andReturn().getResponse().getStatus();
        try (var tarefas = Executors.newFixedThreadPool(3)) {
            for (var resultado : tarefas.invokeAll(List.of(gravar, gravar, gravar))) {
                assertThat(resultado.get()).isEqualTo(204);
            }
        }
        mvc.perform(get(ROOT).with(como(titular))).andExpect(jsonPath("$.totalItens").value(1));
    }

    private Usuario conta(TipoUsuario tipo) {
        return usuarios.save(new Usuario("Pessoa Fictícia", "salvos-" + UUID.randomUUID() + "@example.test", "fixture", tipo));
    }

    private RequestPostProcessor como(Usuario conta) {
        return user(new UsuarioPrincipal(conta.getId(), conta.getNome(), conta.getEmail(), "fixture", conta.getTipoUsuario()));
    }

    private Mentor mentor() {
        var mentor = new Mentor(conta(TipoUsuario.MENTOR), LocalDate.of(2026, 11, 22), "Perfil de teste", "", "",
                Set.of(new DisponibilidadeMentor(4, PeriodoDisponibilidade.NOITE)));
        mentor.setStatus(StatusPerfilMentor.PUBLICADO);
        mentor = mentores.save(mentor);
        var quiz = PublicacaoStartupFixtures.questionario();
        quiz.setMentor(mentor);
        quiz.setKind(TipoUsuario.MENTOR);
        quiz.setSectors(List.of(Setor.TECH));
        quiz.setTopics(List.of(Topico.VALIDATION));
        quiz.setExperience(Map.of(Topico.VALIDATION, Experiencia.PRACTICAL));
        quiz.setAudiences(List.of(Publico.B2B));
        quiz.setBackgrounds(List.of(Formacao.TECH));
        quiz.setCapacity(Capacidade.MANY);
        quiz.setAvailability(List.of());
        quiz.setUpdatedAt(ATUALIZADO);
        questionarios.save(quiz);
        return mentor;
    }
}
