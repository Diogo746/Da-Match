package br.senac.fullstack.mentor.application.service;

import br.senac.fullstack.mentor.api.dto.AtualizarPerfilMentorRequest;
import br.senac.fullstack.mentor.api.dto.AtualizarStatusPerfilMentorRequest;
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
import java.time.ZoneId;
import java.util.UUID;

@Service
public class MentorService {
    private static final ZoneId PLATFORM_TIME_ZONE = ZoneId.of("America/Sao_Paulo");

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
                LocalDate.now(PLATFORM_TIME_ZONE),
                request.biografia(),
                request.linkedin(),
                request.instagram(),
                mentorMapper.toEntities(request.disponibilidades())
        );

        Mentor mentorSalvo = mentorRepository.save(mentor);
        return mentorMapper.toResponse(mentorSalvo);
    }

    @Transactional
    public MentorResponse atualizarPerfil(UUID mentorId, AtualizarPerfilMentorRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Os dados do perfil são obrigatórios.");
        }
        if (request.disponibilidades() != null && request.disponibilidades().isEmpty()) {
            throw new IllegalArgumentException("Disponibilidades não podem ficar vazias.");
        }

        Mentor mentor = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new MentorNaoEncontradoException("Mentor não encontrado"));
        mentorMapper.atualizarPerfil(request, mentor);

        if (request.disponibilidades() != null) {
            mentor.setDisponibilidades(mentorMapper.toEntities(request.disponibilidades()));
        }

        return mentorMapper.toResponse(mentor);
    }

    @Transactional
    public MentorResponse atualizarStatus(UUID mentorId, AtualizarStatusPerfilMentorRequest request) {
        if (request == null || request.status() == null) {
            throw new IllegalArgumentException("O status do perfil é obrigatório.");
        }

        Mentor mentor = mentorRepository.findById(mentorId)
                .orElseThrow(() -> new MentorNaoEncontradoException("Mentor não encontrado"));
        mentor.setStatus(request.status());
        return mentorMapper.toResponse(mentor);
    }


    public MentorResponse buscarMentor(Usuario usuario) {
        Mentor mentor = mentorRepository.findByUsuario(usuario).orElseThrow(() -> new MentorNaoEncontradoException("Mentor não encontrado"));
        return mentorMapper.toResponse(mentor);
    }
}
