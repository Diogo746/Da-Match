package br.senac.fullstack.usuario.domain.entity;

import br.senac.fullstack.shared.enums.TipoUsuario;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class UsuarioTest {

    @Test
    void shouldKeepDataReceivedByConstructor() {
        Usuario usuario = new Usuario("Maria Silva", "maria@damatch.com", "senha-codificada", TipoUsuario.STARTUP);

        assertEquals("Maria Silva", usuario.getNome());
        assertEquals("maria@damatch.com", usuario.getEmail());
        assertEquals("senha-codificada", usuario.getSenha());
        assertEquals(TipoUsuario.STARTUP, usuario.getTipoUsuario());

        UUID idLdap = UUID.randomUUID();
        usuario.setIdLdap(idLdap);

        assertEquals(idLdap, usuario.getIdLdap());
    }
}
