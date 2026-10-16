package br.senac.fullstack.mentor.domain;

import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class MentorTest {

    @Test
    void shouldNormalizeOptionalProfileFields() {
        Mentor mentor = new Mentor(
                new Usuario("Mentor de Teste", "mentor.teste@example.com", "senha-codificada", TipoUsuario.MENTOR),
                LocalDate.of(2026, 10, 15),
                " Biografia do mentor ",
                "  ",
                " @mentor.teste "
        );

        assertEquals("Biografia do mentor", mentor.getBiografia());
        assertNull(mentor.getLinkedin());
        assertEquals("@mentor.teste", mentor.getInstagram());
    }
}
