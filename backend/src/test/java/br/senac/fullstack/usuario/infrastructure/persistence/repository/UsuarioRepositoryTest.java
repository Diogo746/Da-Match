package br.senac.fullstack.usuario.infrastructure.persistence.repository;

import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@ActiveProfiles("test")
class UsuarioRepositoryTest {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void shouldPersistAndFindUserByEmail() {
        Usuario usuario = new Usuario("Maria Silva", "maria@damatch.com", "senha-codificada", TipoUsuario.MENTOR);
        Usuario usuarioSalvo = usuarioRepository.saveAndFlush(usuario);

        Optional<Usuario> resultado = usuarioRepository.findByEmail(usuario.getEmail());

        assertNotNull(usuarioSalvo.getId());
        assertTrue(usuarioRepository.existsByEmail(usuario.getEmail()));
        assertTrue(resultado.isPresent());
        assertEquals(usuarioSalvo.getId(), resultado.orElseThrow().getId());
    }

    @Test
    void shouldReturnEmptyWhenEmailDoesNotExist() {
        String email = "inexistente@damatch.com";

        assertFalse(usuarioRepository.existsByEmail(email));
        assertTrue(usuarioRepository.findByEmail(email).isEmpty());
    }
}
