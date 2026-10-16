package br.senac.fullstack.mentor.application.service;

import br.senac.fullstack.mentor.api.dto.CadastrarMentorRequest;
import br.senac.fullstack.mentor.api.dto.MentorResponse;
import br.senac.fullstack.mentor.api.mapper.MentorMapper;
import br.senac.fullstack.mentor.domain.Mentor;
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

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
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
                " mentor.teste "
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
                null
        );
        when(usuarioService.criarConta(
                usuarioRequest.nome(),
                usuarioRequest.email(),
                usuarioRequest.senha(),
                TipoUsuario.MENTOR
        )).thenReturn(usuario);
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
        assertEquals(TipoUsuario.MENTOR, mentor.getUsuario().getTipoUsuario());
        assertSame(mentorResponse, resultado);
    }
}
