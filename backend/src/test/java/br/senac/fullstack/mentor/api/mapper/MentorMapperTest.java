package br.senac.fullstack.mentor.api.mapper;

import br.senac.fullstack.mentor.api.dto.AtualizarPerfilMentorRequest;
import br.senac.fullstack.mentor.api.dto.MentorResponse;
import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.time.LocalDate;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

class MentorMapperTest {

    private final MentorMapper mentorMapper = Mappers.getMapper(MentorMapper.class);

    @Test
    void shouldMapMentorToResponseWithoutSensitiveUserData() {
        UUID mentorId = UUID.randomUUID();
        UUID usuarioId = UUID.randomUUID();
        Usuario usuario = new Usuario(
                "Mentor de Teste",
                "mentor.teste@example.com",
                "senha-codificada",
                TipoUsuario.MENTOR
        );
        usuario.setId(usuarioId);
        Mentor mentor = new Mentor(
                usuario,
                LocalDate.of(2026, 10, 15),
                "Biografia do mentor",
                "https://www.linkedin.com/in/mentor-teste",
                "mentor.teste"
        );
        mentor.setId(mentorId);
        mentor.setSite("https://mentor.example.com");

        MentorResponse response = mentorMapper.toResponse(mentor);

        assertEquals(mentorId, response.id());
        assertEquals(usuarioId, response.usuarioId());
        assertEquals("Mentor de Teste", response.nome());
        assertEquals("mentor.teste@example.com", response.email());
        assertEquals("Biografia do mentor", response.biografia());
        assertEquals("https://www.linkedin.com/in/mentor-teste", response.linkedin());
        assertEquals("mentor.teste", response.instagram());
        assertEquals("https://mentor.example.com", response.site());
    }

    @Test
    void shouldIgnoreBlankProfileFieldsWhenUpdatingMentor() {
        Mentor mentor = new Mentor(
                new Usuario("Mentor de Teste", "mentor.teste@example.com", "senha-codificada", TipoUsuario.MENTOR),
                LocalDate.of(2026, 10, 15),
                "Biografia original",
                "https://www.linkedin.com/in/original",
                "mentor.original"
        );
        mentor.setSite("https://original.example.com");

        mentorMapper.atualizarPerfil(new AtualizarPerfilMentorRequest(
                UUID.randomUUID(),
                "  ",
                null,
                "novo.instagram",
                "  "
        ), mentor);

        assertEquals("Biografia original", mentor.getBiografia());
        assertEquals("https://www.linkedin.com/in/original", mentor.getLinkedin());
        assertEquals("novo.instagram", mentor.getInstagram());
        assertEquals("https://original.example.com", mentor.getSite());
    }
}
