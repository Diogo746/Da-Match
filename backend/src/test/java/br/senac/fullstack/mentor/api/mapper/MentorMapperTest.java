package br.senac.fullstack.mentor.api.mapper;

import br.senac.fullstack.mentor.api.dto.AtualizarPerfilMentorRequest;
import br.senac.fullstack.mentor.api.dto.DisponibilidadeMentorRequest;
import br.senac.fullstack.mentor.api.dto.MentorResponse;
import br.senac.fullstack.mentor.domain.DisponibilidadeMentor;
import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.mentor.domain.enums.PeriodoDisponibilidade;
import br.senac.fullstack.mentor.domain.enums.StatusPerfilMentor;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;

import java.time.LocalDate;
import java.util.UUID;
import java.util.Set;

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
                "mentor.teste",
                Set.of(new DisponibilidadeMentor(1, PeriodoDisponibilidade.MANHA))
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
        assertEquals(StatusPerfilMentor.RASCUNHO, response.status());
        assertEquals(Set.of(new DisponibilidadeMentor(1, PeriodoDisponibilidade.MANHA)), mentor.getDisponibilidades());
        assertEquals(1, response.disponibilidades().size());
        assertEquals(1, response.disponibilidades().iterator().next().diaSemana());
        assertEquals(PeriodoDisponibilidade.MANHA, response.disponibilidades().iterator().next().periodo());
    }

    @Test
    void shouldIgnoreBlankProfileFieldsWhenUpdatingMentor() {
        Mentor mentor = new Mentor(
                new Usuario("Mentor de Teste", "mentor.teste@example.com", "senha-codificada", TipoUsuario.MENTOR),
                LocalDate.of(2026, 10, 15),
                "Biografia original",
                "https://www.linkedin.com/in/original",
                "mentor.original",
                Set.of()
        );
        mentor.setSite("https://original.example.com");

        mentorMapper.atualizarPerfil(new AtualizarPerfilMentorRequest(
                "  ",
                null,
                "novo.instagram",
                "  ",
                null
        ), mentor);

        assertEquals("Biografia original", mentor.getBiografia());
        assertEquals("https://www.linkedin.com/in/original", mentor.getLinkedin());
        assertEquals("novo.instagram", mentor.getInstagram());
        assertEquals("https://original.example.com", mentor.getSite());
    }

    @Test
    void shouldMapAvailabilityRequestToDomain() {
        Set<DisponibilidadeMentor> disponibilidades = mentorMapper.toEntities(Set.of(
                new DisponibilidadeMentorRequest(5, PeriodoDisponibilidade.NOITE)
        ));

        assertEquals(Set.of(new DisponibilidadeMentor(5, PeriodoDisponibilidade.NOITE)), disponibilidades);
    }
}
