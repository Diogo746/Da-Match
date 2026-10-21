package br.senac.fullstack.auth.infrastructure.security;

import br.senac.fullstack.shared.enums.TipoUsuario;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.List;
import java.util.UUID;

public final class UsuarioPrincipal extends User {
    private final UUID id;
    private final String nome;
    private final TipoUsuario tipoUsuario;

    public UsuarioPrincipal(UUID id, String nome, String email, String hash, TipoUsuario tipoUsuario) {
        super(email, hash, List.of(new SimpleGrantedAuthority("ROLE_" + tipoUsuario.name())));
        this.id = id;
        this.nome = nome;
        this.tipoUsuario = tipoUsuario;
    }

    public UUID getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public TipoUsuario getTipoUsuario() {
        return tipoUsuario;
    }

    @Override
    public String toString() {
        return "UsuarioPrincipal[redacted]";
    }
}
