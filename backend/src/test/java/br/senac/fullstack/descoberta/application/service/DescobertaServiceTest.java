package br.senac.fullstack.descoberta.application.service;

import br.senac.fullstack.auth.infrastructure.security.UsuarioPrincipal;
import br.senac.fullstack.descoberta.api.mapper.DescobertaMapper;
import br.senac.fullstack.descoberta.infrastructure.query.DescobertaQueryRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.shared.security.ResourceAccess;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class DescobertaServiceTest {
    private static final Map<String, List<String>> EMPTY = Map.of();
    private final DescobertaQueryRepository repository = mock(DescobertaQueryRepository.class);
    private final DescobertaService service = new DescobertaService(repository, mock(ElegibilidadeDescobertaService.class),
            new DescobertaMapper(), new ResourceAccess());

    @AfterEach
    void clear() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void serviceAlsoRejectsForbiddenActorsBeforeQueryingOrValidatingFilters() {
        UUID id = UUID.randomUUID();
        Map<String, List<String>> invalid = Map.of("ator", List.of("forjado"));
        assertThatExceptionOfType(AccessDeniedException.class)
                .isThrownBy(() -> service.listar(TipoUsuario.MENTOR, invalid));
        actor(TipoUsuario.ADMIN);
        assertThatExceptionOfType(AccessDeniedException.class)
                .isThrownBy(() -> service.detalhar(TipoUsuario.STARTUP, id, EMPTY));
        actor(TipoUsuario.STARTUP);
        assertThatExceptionOfType(AccessDeniedException.class)
                .isThrownBy(() -> service.listar(TipoUsuario.STARTUP, EMPTY));
        actor(TipoUsuario.MENTOR);
        assertThatExceptionOfType(AccessDeniedException.class)
                .isThrownBy(() -> service.detalhar(TipoUsuario.MENTOR, id, EMPTY));
        verifyNoInteractions(repository);
    }

    @Test
    void rejectsMissingIdsAndUnsupportedCatalogsWithoutFallingBackToAnArbitraryProfile() {
        actor(TipoUsuario.STARTUP);
        assertThatExceptionOfType(IllegalArgumentException.class)
                .isThrownBy(() -> service.detalhar(TipoUsuario.MENTOR, null, EMPTY));
        assertThatExceptionOfType(IllegalArgumentException.class)
                .isThrownBy(() -> service.listar(TipoUsuario.ADMIN, EMPTY));
        verifyNoInteractions(repository);
    }

    @Test
    void emptyCatalogAndUnavailableDetailHaveDifferentOutcomes() {
        actor(TipoUsuario.MENTOR);
        when(repository.consultar(any(), any(), isNull())).thenReturn(List.of());
        var page = service.listar(TipoUsuario.STARTUP, EMPTY);
        assertThat(page.itens()).isEmpty();
        assertThat(page.totalItens()).isZero();
        UUID id = UUID.randomUUID();
        when(repository.consultar(any(), any(), any(UUID.class))).thenReturn(List.of());
        assertThatExceptionOfType(NoSuchElementException.class)
                .isThrownBy(() -> service.detalhar(TipoUsuario.STARTUP, id, EMPTY));
    }

    @Test
    void databaseFailureDoesNotBecomeAFakeEmptyList() {
        actor(TipoUsuario.STARTUP);
        when(repository.consultar(any(), any(), isNull())).thenThrow(new IllegalStateException("falha de teste"));
        assertThatExceptionOfType(IllegalStateException.class)
                .isThrownBy(() -> service.listar(TipoUsuario.MENTOR, EMPTY));
    }

    private void actor(TipoUsuario role) {
        var principal = new UsuarioPrincipal(UUID.randomUUID(), "Leitor fictício", "reader@example.test", "unused", role);
        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken(principal, null, "ROLE_" + role.name()));
    }
}
