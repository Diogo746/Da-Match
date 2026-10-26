package br.senac.fullstack.perfilmatch.api.mapper;

import br.senac.fullstack.mentor.domain.DisponibilidadeMentor;
import br.senac.fullstack.mentor.domain.enums.PeriodoDisponibilidade;
import br.senac.fullstack.perfilmatch.api.dto.AgendaPerfilMatchDto;
import br.senac.fullstack.perfilmatch.api.dto.PerfilMatchResponse;
import br.senac.fullstack.perfilmatch.api.dto.SalvarPerfilMatchRequest;
import br.senac.fullstack.perfilmatch.domain.AgendaPerfilMatch;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Dia;
import br.senac.fullstack.perfilmatch.domain.CodigosPerfilMatch.Periodo;
import br.senac.fullstack.perfilmatch.domain.PerfilMatch;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class PerfilMatchMapper {
    public PerfilMatch toEntity(SalvarPerfilMatchRequest request) {
        PerfilMatch entity = new PerfilMatch();
        entity.setQuestionnaireVersion(request.questionnaireVersion());
        entity.setKind(request.kind());
        entity.setProjectName(request.projectName() == null ? "" : request.projectName().strip());
        entity.setMoments(request.moments());
        entity.setSectors(request.sectors());
        entity.setTopics(request.topics());
        entity.setExperience(request.experience() == null ? Map.of() : request.experience());
        entity.setAudiences(request.audiences());
        entity.setBackgrounds(request.backgrounds());
        entity.setCapacity(request.capacity());
        entity.setFormat(request.format());
        entity.setCityId(request.cityId() == null ? "" : request.cityId());
        entity.setAvailability(request.availability() == null ? null : request.availability().stream()
                .map(slot -> slot == null ? null : new AgendaPerfilMatch(slot.day(), slot.period())).toList());
        entity.setCadence(request.cadence());
        entity.setAccepting(request.accepting() == null || request.accepting());
        return entity;
    }

    public void update(PerfilMatch source, PerfilMatch target) {
        target.setQuestionnaireVersion(source.getQuestionnaireVersion());
        target.setKind(source.getKind());
        target.setProjectName(source.getProjectName());
        target.setMoments(new ArrayList<>(source.getMoments()));
        target.setSectors(new ArrayList<>(source.getSectors()));
        target.setTopics(new ArrayList<>(source.getTopics()));
        target.setExperience(new HashMap<>(source.getExperience()));
        target.setAudiences(new ArrayList<>(source.getAudiences()));
        target.setBackgrounds(new ArrayList<>(source.getBackgrounds()));
        target.setCapacity(source.getCapacity());
        target.setFormat(source.getFormat());
        target.setCityId(source.getCityId());
        target.setAvailability(new ArrayList<>(source.getAvailability()));
        target.setCadence(source.getCadence());
        target.setAccepting(source.isAccepting());
    }

    public PerfilMatchResponse toResponse(PerfilMatch entity, List<AgendaPerfilMatch> availability) {
        return new PerfilMatchResponse(entity.getQuestionnaireVersion(), entity.getKind(), entity.getProjectName(),
                List.copyOf(entity.getMoments()), List.copyOf(entity.getSectors()), List.copyOf(entity.getTopics()),
                Map.copyOf(entity.getExperience()), List.copyOf(entity.getAudiences()),
                List.copyOf(entity.getBackgrounds()), entity.getCapacity(), entity.getFormat(), entity.getCityId(),
                availability.stream().map(slot -> new AgendaPerfilMatchDto(slot.getDay(), slot.getPeriod())).toList(),
                entity.getCadence(), entity.isAccepting(), entity.getUpdatedAt());
    }

    public Set<DisponibilidadeMentor> toMentorAvailability(List<AgendaPerfilMatch> slots) {
        Set<DisponibilidadeMentor> result = new LinkedHashSet<>();
        for (AgendaPerfilMatch slot : slots) {
            result.add(new DisponibilidadeMentor(slot.getDay().ordinal() + 1, switch (slot.getPeriod()) {
                case MORNING -> PeriodoDisponibilidade.MANHA;
                case AFTERNOON -> PeriodoDisponibilidade.TARDE;
                case EVENING -> PeriodoDisponibilidade.NOITE;
                default -> throw new IllegalArgumentException("Período inválido.");
            }));
        }
        return result;
    }

    public List<AgendaPerfilMatch> fromMentorAvailability(Set<DisponibilidadeMentor> slots) {
        return slots.stream().sorted(Comparator.comparingInt(DisponibilidadeMentor::getDiaSemana)
                .thenComparing(DisponibilidadeMentor::getPeriodo))
                .map(slot -> new AgendaPerfilMatch(Dia.values()[slot.getDiaSemana() - 1],
                        switch (slot.getPeriodo()) {
                            case MANHA -> Periodo.MORNING;
                            case TARDE -> Periodo.AFTERNOON;
                            case NOITE -> Periodo.EVENING;
                            default -> throw new IllegalArgumentException("Período inválido.");
                        })).toList();
    }
}
