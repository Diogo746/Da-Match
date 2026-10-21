package br.senac.fullstack.shared.security;

import br.senac.fullstack.auth.infrastructure.security.UsuarioPrincipal;
import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.domain.enums.PapelMembroStartup;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class ResourceAccess {
    public UUID currentMentorUserId() {
        return requireRole(TipoUsuario.MENTOR).getId();
    }

    public void requireMentorOwner(Mentor mentor) {
        UsuarioPrincipal principal = requireRole(TipoUsuario.MENTOR);
        if (!principal.getId().equals(mentor.getUsuario().getId())) {
            throw new AccessDeniedException("Acesso negado.");
        }
    }

    public void requireStartupManager(Startup startup) {
        UsuarioPrincipal principal = requireRole(TipoUsuario.STARTUP);
        boolean manager = startup.getMembros().stream().anyMatch(member ->
                member.getUsuario().getId().equals(principal.getId())
                        && (member.getPapelMembro() == PapelMembroStartup.FUNDADOR
                        || member.getPapelMembro() == PapelMembroStartup.REPRESENTANTE));
        if (!manager) {
            throw new AccessDeniedException("Acesso negado.");
        }
    }

    private UsuarioPrincipal requireRole(TipoUsuario role) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()
                || !(authentication.getPrincipal() instanceof UsuarioPrincipal principal)
                || principal.getTipoUsuario() != role) {
            throw new AccessDeniedException("Acesso negado.");
        }
        return principal;
    }
}
