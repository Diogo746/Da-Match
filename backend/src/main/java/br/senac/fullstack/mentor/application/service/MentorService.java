package br.senac.fullstack.mentor.application.service;

import br.senac.fullstack.mentor.api.dto.AtualizarPerfilMentorRequest;
import br.senac.fullstack.mentor.api.dto.CadastrarMentorRequest;
import br.senac.fullstack.mentor.api.dto.MentorResponse;
import br.senac.fullstack.mentor.api.mapper.MentorMapper;
import br.senac.fullstack.mentor.application.exception.MentorNaoEncontradoException;
import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.mentor.infrastructure.persistence.repository.MentorRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.usuario.application.service.UsuarioService;
import br.senac.fullstack.usuario.domain.entity.Usuario;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class MentorService {
    private final MentorRepository mentorRepository;
    private final UsuarioService usuarioService;
    private final MentorMapper mentorMapper;

    public MentorService(MentorRepository mentorRepository, UsuarioService usuarioService, MentorMapper mentorMapper) {
        this.mentorRepository = mentorRepository;
        this.usuarioService = usuarioService;
        this.mentorMapper = mentorMapper;
    }

    @Transactional
    public MentorResponse criarMentor(CadastrarMentorRequest request) {
        Usuario novoUsuario = usuarioService.criarConta(
                request.usuario().nome(),
                request.usuario().email(),
                request.usuario().senha(),
                TipoUsuario.MENTOR
        );

        Mentor mentor = new Mentor(
                novoUsuario,
                LocalDate.now(),
                request.biografia(),
                request.linkedin(),
                request.instagram()
        );

        Mentor mentorSalvo = mentorRepository.save(mentor);
        return mentorMapper.toResponse(mentorSalvo);
    }

    @Transactional
    public void atualizarPerfil(AtualizarPerfilMentorRequest  request) {
        Mentor mentor = mentorRepository.findById(request.id()).orElseThrow(() -> new MentorNaoEncontradoException("Mentor não encontrado"));
        mentorMapper.atualizarPerfil(request, mentor);

    }


    public MentorResponse buscarMentor(Usuario usuario) {
        Mentor mentor = mentorRepository.findByUsuario(usuario).orElseThrow(() -> new MentorNaoEncontradoException("Mentor não encontrado"));
        return mentorMapper.toResponse(mentor);
    }
}
