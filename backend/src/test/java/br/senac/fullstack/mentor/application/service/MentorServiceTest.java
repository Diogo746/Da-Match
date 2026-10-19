package br.senac.fullstack.mentor.application.service;

import br.senac.fullstack.mentor.api.dto.CadastrarMentorRequest;
import br.senac.fullstack.mentor.api.dto.DisponibilidadeMentorRequest;
import br.senac.fullstack.mentor.api.dto.MentorResponse;
import br.senac.fullstack.mentor.api.dto.AtualizarPerfilMentorRequest;
import br.senac.fullstack.mentor.api.dto.AtualizarStatusPerfilMentorRequest;
import br.senac.fullstack.mentor.api.mapper.MentorMapper;
import br.senac.fullstack.mentor.application.exception.MentorNaoEncontradoException;
import br.senac.fullstack.mentor.domain.DisponibilidadeMentor;
import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.mentor.domain.enums.PeriodoDisponibilidade;
import br.senac.fullstack.mentor.domain.enums.StatusPerfilMentor;
import br.senac.fullstack.mentor.infrastructure.persistence.repository.MentorRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.api.dto.CadastrarUsuarioRequest;
import br.senac.fullstack.usuario.application.service.UsuarioService;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Set;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MentorServiceTest {

    @Mock
    private MentorRepository mentorRepository;

    @Mock
    private UsuarioService usuarioService;

    @Mock
    private MentorMapper mentorMapper;

    @InjectMocks
    private MentorService mentorService;

    @Test
    void shouldCreateMentorWithTheRegisteredUserAndProfileData() {
        CadastrarUsuarioRequest usuarioRequest = new CadastrarUsuarioRequest(
                "Mentor de Teste",
                "mentor.teste@example.com",
                "senha-ficticia"
        );
        CadastrarMentorRequest request = new CadastrarMentorRequest(
                usuarioRequest,
                "Experiencia em produtos digitais.",
                " https://www.linkedin.com/in/mentor-teste ",
                " mentor.teste ",
                Set.of(new DisponibilidadeMentorRequest(1, PeriodoDisponibilidade.MANHA))
        );
        Usuario usuario = new Usuario(
                usuarioRequest.nome(),
                usuarioRequest.email(),
                "senha-codificada",
                TipoUsuario.MENTOR
        );
        MentorResponse mentorResponse = new MentorResponse(
                null,
                null,
                usuarioRequest.nome(),
                usuarioRequest.email(),
                request.biografia(),
                request.linkedin().strip(),
                request.instagram().strip(),
                null,
                Set.of(),
                StatusPerfilMentor.RASCUNHO,
                null
        );
        when(usuarioService.criarConta(
                usuarioRequest.nome(),
                usuarioRequest.email(),
                usuarioRequest.senha(),
                TipoUsuario.MENTOR
        )).thenReturn(usuario);
        when(mentorMapper.toEntities(request.disponibilidades())).thenReturn(
                Set.of(new DisponibilidadeMentor(1, PeriodoDisponibilidade.MANHA))
        );
        when(mentorRepository.save(any(Mentor.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(mentorMapper.toResponse(any(Mentor.class))).thenReturn(mentorResponse);

        MentorResponse resultado = mentorService.criarMentor(request);

        ArgumentCaptor<Mentor> mentorCaptor = ArgumentCaptor.forClass(Mentor.class);
        verify(usuarioService).criarConta(
                usuarioRequest.nome(),
                usuarioRequest.email(),
                usuarioRequest.senha(),
                TipoUsuario.MENTOR
        );
        verify(mentorRepository).save(mentorCaptor.capture());
        Mentor mentor = mentorCaptor.getValue();
        assertSame(usuario, mentor.getUsuario());
        assertEquals("Experiencia em produtos digitais.", mentor.getBiografia());
        assertEquals("https://www.linkedin.com/in/mentor-teste", mentor.getLinkedin());
        assertEquals("mentor.teste", mentor.getInstagram());
        assertEquals(Set.of(new DisponibilidadeMentor(1, PeriodoDisponibilidade.MANHA)), mentor.getDisponibilidades());
        assertEquals(LocalDate.now(ZoneId.of("America/Sao_Paulo")), mentor.getDataEntradaPlataforma());
        assertEquals(TipoUsuario.MENTOR, mentor.getUsuario().getTipoUsuario());
        assertEquals(StatusPerfilMentor.RASCUNHO, mentor.getStatus());
        assertSame(mentorResponse, resultado);
    }

    @Test
    void shouldUpdateMentorProfileStatus() {
        UUID mentorId = UUID.randomUUID();
        Mentor mentor = new Mentor();
        MentorResponse response = new MentorResponse(
                mentorId,
                UUID.randomUUID(),
                "Mentor de Teste",
                "mentor.teste@example.com",
                "Experiencia em produtos digitais.",
                null,
                null,
                null,
                Set.of(),
                StatusPerfilMentor.PUBLICADO,
                LocalDate.of(2026, 10, 15)
        );
        when(mentorRepository.findById(mentorId)).thenReturn(Optional.of(mentor));
        when(mentorMapper.toResponse(mentor)).thenReturn(response);

        MentorResponse result = mentorService.atualizarStatus(
                mentorId,
                new AtualizarStatusPerfilMentorRequest(StatusPerfilMentor.PUBLICADO)
        );

        assertEquals(StatusPerfilMentor.PUBLICADO, mentor.getStatus());
        assertSame(response, result);
    }

    @Test
    void shouldRejectStatusUpdateWithoutStatus() {
        UUID mentorId = UUID.randomUUID();
        AtualizarStatusPerfilMentorRequest request = new AtualizarStatusPerfilMentorRequest(null);

        assertThrows(IllegalArgumentException.class, () -> mentorService.atualizarStatus(mentorId, request));
    }

    @Test
    void shouldRejectStatusUpdateForUnknownMentor() {
        UUID mentorId = UUID.randomUUID();
        AtualizarStatusPerfilMentorRequest request =
                new AtualizarStatusPerfilMentorRequest(StatusPerfilMentor.PAUSADO);
        when(mentorRepository.findById(mentorId)).thenReturn(Optional.empty());

        assertThrows(MentorNaoEncontradoException.class, () -> mentorService.atualizarStatus(mentorId, request));
    }

    @Test
    void shouldUpdateMentorProfileAndAvailability() {
        UUID mentorId = UUID.randomUUID();
        Mentor mentor = new Mentor();
        Set<DisponibilidadeMentorRequest> disponibilidades =
                Set.of(new DisponibilidadeMentorRequest(3, PeriodoDisponibilidade.TARDE));
        AtualizarPerfilMentorRequest request = new AtualizarPerfilMentorRequest(
                "Nova biografia",
                "https://www.linkedin.com/in/mentor-atualizado",
                "mentor.atualizado",
                "https://mentor.example.com",
                disponibilidades
        );
        Set<DisponibilidadeMentor> disponibilidadesAtualizadas =
                Set.of(new DisponibilidadeMentor(3, PeriodoDisponibilidade.TARDE));
        MentorResponse response = new MentorResponse(
                mentorId,
                UUID.randomUUID(),
                "Mentor de Teste",
                "mentor.teste@example.com",
                "Nova biografia",
                "https://www.linkedin.com/in/mentor-atualizado",
                "mentor.atualizado",
                "https://mentor.example.com",
                Set.of(),
                StatusPerfilMentor.RASCUNHO,
                LocalDate.of(2026, 10, 19)
        );
        when(mentorRepository.findById(mentorId)).thenReturn(Optional.of(mentor));
        when(mentorMapper.toEntities(disponibilidades)).thenReturn(disponibilidadesAtualizadas);
        when(mentorMapper.toResponse(mentor)).thenReturn(response);

        MentorResponse result = mentorService.atualizarPerfil(mentorId, request);

        verify(mentorMapper).atualizarPerfil(request, mentor);
        assertEquals(disponibilidadesAtualizadas, mentor.getDisponibilidades());
        assertSame(response, result);
    }

    @Test
    void shouldRejectProfileUpdateWithEmptyAvailability() {
        UUID mentorId = UUID.randomUUID();
        AtualizarPerfilMentorRequest request = new AtualizarPerfilMentorRequest(
                null,
                null,
                null,
                null,
                Set.of()
        );

        assertThrows(IllegalArgumentException.class, () -> mentorService.atualizarPerfil(mentorId, request));
    }

    @Test
    void shouldKeepAvailabilityWhenProfileUpdateDoesNotProvideIt() {
        UUID mentorId = UUID.randomUUID();
        Set<DisponibilidadeMentor> disponibilidadeOriginal =
                Set.of(new DisponibilidadeMentor(2, PeriodoDisponibilidade.MANHA));
        Mentor mentor = new Mentor();
        mentor.setDisponibilidades(disponibilidadeOriginal);
        AtualizarPerfilMentorRequest request = new AtualizarPerfilMentorRequest(
                "Biografia atualizada",
                null,
                null,
                null,
                null
        );
        MentorResponse response = new MentorResponse(
                mentorId,
                UUID.randomUUID(),
                "Mentor de Teste",
                "mentor.teste@example.com",
                "Biografia atualizada",
                null,
                null,
                null,
                Set.of(),
                StatusPerfilMentor.RASCUNHO,
                LocalDate.of(2026, 10, 19)
        );
        when(mentorRepository.findById(mentorId)).thenReturn(Optional.of(mentor));
        when(mentorMapper.toResponse(mentor)).thenReturn(response);

        mentorService.atualizarPerfil(mentorId, request);

        assertEquals(disponibilidadeOriginal, mentor.getDisponibilidades());
    }
}
