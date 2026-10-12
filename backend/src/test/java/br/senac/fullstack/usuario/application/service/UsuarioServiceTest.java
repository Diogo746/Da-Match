package br.senac.fullstack.usuario.application.service;

import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.application.exception.EmailExistenteException;
import br.senac.fullstack.usuario.application.exception.UsuarioNaoEncontradoException;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Captor
    private ArgumentCaptor<Usuario> usuarioCaptor;

    @InjectMocks
    private UsuarioService usuarioService;

    @Test
    void shouldCreateAccountWithEncodedPassword() {
        String nome = "Maria Silva";
        String email = "maria@damatch.com";
        String senha = "senha-segura";
        String senhaCodificada = "$2a$10$senhaCodificada";

        when(usuarioRepository.existsByEmail(email)).thenReturn(false);
        when(passwordEncoder.encode(senha)).thenReturn(senhaCodificada);

        usuarioService.criarConta(nome, email, senha, TipoUsuario.MENTOR);

        verify(passwordEncoder).encode(senha);
        verify(usuarioRepository).save(usuarioCaptor.capture());
        Usuario usuarioSalvo = usuarioCaptor.getValue();
        assertEquals(nome, usuarioSalvo.getNome());
        assertEquals(email, usuarioSalvo.getEmail());
        assertEquals(senhaCodificada, usuarioSalvo.getSenha());
        assertEquals(TipoUsuario.MENTOR, usuarioSalvo.getTipoUsuario());
    }

    @Test
    void shouldNotCreateAccountWhenEmailAlreadyExists() {
        String email = "maria@damatch.com";
        when(usuarioRepository.existsByEmail(email)).thenReturn(true);

        EmailExistenteException exception = assertThrows(
                EmailExistenteException.class,
                () -> usuarioService.criarConta("Maria Silva", email, "senha-segura", TipoUsuario.MENTOR)
        );

        assertEquals("Email existente", exception.getMessage());
        verify(passwordEncoder, never()).encode("senha-segura");
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void shouldReturnUserWhenEmailExists() {
        Usuario usuario = new Usuario("Maria Silva", "maria@damatch.com", "senha-codificada", TipoUsuario.MENTOR);
        when(usuarioRepository.findByEmail(usuario.getEmail())).thenReturn(Optional.of(usuario));

        Usuario resultado = usuarioService.buscarUsuarioPorEmail(usuario.getEmail());

        assertSame(usuario, resultado);
    }

    @Test
    void shouldThrowExceptionWhenUserIsNotFound() {
        String email = "inexistente@damatch.com";
        when(usuarioRepository.findByEmail(email)).thenReturn(Optional.empty());

        UsuarioNaoEncontradoException exception = assertThrows(
                UsuarioNaoEncontradoException.class,
                () -> usuarioService.buscarUsuarioPorEmail(email)
        );

        assertEquals("Usuário não encontrado", exception.getMessage());
    }
}
