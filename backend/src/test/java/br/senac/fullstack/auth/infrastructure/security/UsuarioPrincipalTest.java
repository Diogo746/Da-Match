package br.senac.fullstack.auth.infrastructure.security;

import br.senac.fullstack.shared.enums.TipoUsuario;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class UsuarioPrincipalTest {
    @Test
    void identityUsesExactEmailAndRemainsSymmetricWithSpringUser() {
        UsuarioPrincipal principal = principal("conta@example.test");
        User springUser = new User("conta@example.test", "outro-hash-ficticio",
                List.of(new SimpleGrantedAuthority("ROLE_MENTOR")));
        UsuarioPrincipal sameEmail = new UsuarioPrincipal(UUID.randomUUID(), "Outro nome",
                "conta@example.test", "outro-hash-ficticio", TipoUsuario.STARTUP);

        assertThat(principal).isEqualTo(springUser).isEqualTo(sameEmail)
                .hasSameHashCodeAs(springUser).hasSameHashCodeAs(sameEmail);
        assertThat(springUser).isEqualTo(principal);
        assertThat(sameEmail).isEqualTo(principal);
        assertThat(principal).isNotEqualTo(principal("outra@example.test"))
                .isNotEqualTo(principal("CONTA@example.test"));
    }

    @Test
    void erasingCredentialsPreservesIdentityAndRole() {
        UsuarioPrincipal principal = principal("conta@example.test");
        Set<UsuarioPrincipal> principals = new HashSet<>();
        principals.add(principal);

        principal.eraseCredentials();

        assertThat(principal.getPassword()).isNull();
        assertThat(principals).contains(principal);
        assertThat(principal.getAuthorities()).extracting("authority").containsExactly("ROLE_MENTOR");
        assertThat(principal.getTipoUsuario()).isEqualTo(TipoUsuario.MENTOR);
    }

    @Test
    void stringRepresentationDoesNotExposeAccountOrCredentials() {
        UsuarioPrincipal principal = principal("conta@example.test");

        assertThat(principal.toString()).isEqualTo("UsuarioPrincipal[redacted]");
    }

    private UsuarioPrincipal principal(String email) {
        return new UsuarioPrincipal(UUID.randomUUID(), "Pessoa Ficticia", email,
                "hash-ficticio", TipoUsuario.MENTOR);
    }
}
