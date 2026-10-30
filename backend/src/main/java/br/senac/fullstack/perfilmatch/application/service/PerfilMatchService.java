package br.senac.fullstack.perfilmatch.application.service;

import br.senac.fullstack.mentor.domain.Mentor;
import br.senac.fullstack.mentor.infrastructure.persistence.repository.MentorRepository;
import br.senac.fullstack.perfilmatch.api.dto.PerfilMatchResponse;
import br.senac.fullstack.perfilmatch.api.dto.SalvarPerfilMatchRequest;
import br.senac.fullstack.perfilmatch.api.mapper.PerfilMatchMapper;
import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
import br.senac.fullstack.perfilmatch.infrastructure.persistence.repository.PerfilMatchRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.shared.security.ResourceAccess;
import br.senac.fullstack.startup.domain.Startup;
import br.senac.fullstack.startup.application.service.AptidaoPublicacaoStartupService;
import br.senac.fullstack.startup.infrastructure.persistence.repository.StartupRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class PerfilMatchService {
    private final PerfilMatchRepository profiles;
    private final StartupRepository startups;
    private final MentorRepository mentors;
    private final PerfilMatchMapper mapper;
    private final ResourceAccess access;
    private final AptidaoPublicacaoStartupService aptidao;

    public PerfilMatchService(PerfilMatchRepository profiles, StartupRepository startups,
                             MentorRepository mentors, PerfilMatchMapper mapper, ResourceAccess access,
                             AptidaoPublicacaoStartupService aptidao) {
        this.profiles = profiles;
        this.startups = startups;
        this.mentors = mentors;
        this.mapper = mapper;
        this.access = access;
        this.aptidao = aptidao;
    }

    public Optional<PerfilMatchResponse> consultarStartup(UUID id) {
        Startup startup = startup(id);
        access.requireStartupMember(startup);
        return profiles.findByStartupId(id).map(profile -> mapper.toResponse(profile, profile.getAvailability()));
    }

    public PerfilMatchResponse salvarStartup(UUID id, SalvarPerfilMatchRequest request) {
        Startup startup = startup(id);
        access.requireStartupManager(startup);
        PerfilMatch input = validated(request, TipoUsuario.STARTUP);
        aptidao.validarEdicaoPublicada(startup, input);
        PerfilMatch profile = profiles.findByStartupId(id).orElseGet(PerfilMatch::new);
        mapper.update(input, profile);
        profile.setStartup(startup);
        profile.setUpdatedAt(Instant.now().truncatedTo(ChronoUnit.MICROS));
        profiles.save(profile);
        return mapper.toResponse(profile, profile.getAvailability());
    }

    public Optional<PerfilMatchResponse> consultarMentor(UUID id) {
        Mentor mentor = mentor(id);
        access.requireMentorOwner(mentor);
        return profiles.findByMentorId(id).map(profile ->
                mapper.toResponse(profile, mapper.fromMentorAvailability(mentor.getDisponibilidades())));
    }

    public PerfilMatchResponse salvarMentor(UUID id, SalvarPerfilMatchRequest request) {
        Mentor mentor = mentor(id);
        access.requireMentorOwner(mentor);
        PerfilMatch input = validated(request, TipoUsuario.MENTOR);
        PerfilMatch profile = profiles.findByMentorId(id).orElseGet(PerfilMatch::new);
        mapper.update(input, profile);
        profile.setMentor(mentor);
        profile.setUpdatedAt(Instant.now().truncatedTo(ChronoUnit.MICROS));
        // The existing mentor agenda is the single source of truth, including legacy PATCH updates.
        mentor.setDisponibilidades(mapper.toMentorAvailability(input.getAvailability()));
        profile.getAvailability().clear();
        profiles.save(profile);
        return mapper.toResponse(profile, mapper.fromMentorAvailability(mentor.getDisponibilidades()));
    }

    private PerfilMatch validated(SalvarPerfilMatchRequest request, TipoUsuario kind) {
        if (request == null) {
            throw new IllegalArgumentException("Respostas obrigatórias.");
        }
        PerfilMatch input = mapper.toEntity(request);
        input.validar(kind);
        return input;
    }

    private Startup startup(UUID id) {
        return startups.findById(id).orElseThrow(() -> new NoSuchElementException("Startup não encontrada."));
    }

    private Mentor mentor(UUID id) {
        return mentors.findById(id).orElseThrow(() -> new NoSuchElementException("Mentor não encontrado."));
    }
}
