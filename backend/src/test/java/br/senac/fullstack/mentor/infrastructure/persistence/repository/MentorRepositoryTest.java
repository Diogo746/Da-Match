package br.senac.fullstack.mentor.infrastructure.persistence.repository;

import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@ActiveProfiles("test")
class MentorRepositoryTest {

    @Autowired
    private MentorRepository mentorRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Test
    void shouldPersistAndFindMentorByUser() {
        Usuario usuario = usuarioRepository.saveAndFlush(new Usuario(
                "Mentor de Teste",
                "mentor.teste@example.com",
                "senha-codificada",
                TipoUsuario.MENTOR
        ));
        Mentor mentor = new Mentor(
                usuario,
                LocalDate.of(2026, 10, 15),
                "Biografia do mentor",
                "https://www.linkedin.com/in/mentor-teste",
                "mentor.teste"
        );

        Mentor mentorSalvo = mentorRepository.saveAndFlush(mentor);

        assertNotNull(mentorSalvo.getId());
        assertTrue(mentorRepository.findByUsuario(usuario).isPresent());
        assertEquals(mentorSalvo.getId(), mentorRepository.findByUsuario(usuario).orElseThrow().getId());
    }
}
