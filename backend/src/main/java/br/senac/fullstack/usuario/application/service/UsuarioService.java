package br.senac.fullstack.usuario.application.service;

import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.application.exception.EmailExistenteException;
import br.senac.fullstack.usuario.application.exception.UsuarioNaoEncontradoException;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import br.senac.fullstack.usuario.infrastructure.persistence.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UsuarioService {
    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private boolean emailExiste(String email) {
        return usuarioRepository.existsByEmail(email);
    }

    public void criarConta(String nome, String email, String senha, TipoUsuario tipoUsuario) {
        if (emailExiste(email)) {
            throw new EmailExistenteException("Email existente");
        }
        String senhaHash = hashSenha(senha);

        Usuario usuario = new Usuario(nome, email, senhaHash, tipoUsuario);
        usuarioRepository.save(usuario);
    }

    public Usuario buscarUsuarioPorEmail(String email) {
        return usuarioRepository.findByEmail(email)
                .orElseThrow(() -> new UsuarioNaoEncontradoException("Usuário não encontrado"));
    }

    private String hashSenha(String senha) {
        return passwordEncoder.encode(senha);
    }
}
