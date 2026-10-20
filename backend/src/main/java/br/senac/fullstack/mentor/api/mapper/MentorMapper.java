package br.senac.fullstack.mentor.api.mapper;

import br.senac.fullstack.mentor.api.dto.AtualizarPerfilMentorRequest;
import br.senac.fullstack.mentor.api.dto.DisponibilidadeMentorRequest;
import br.senac.fullstack.mentor.api.dto.DisponibilidadeMentorResponse;
import br.senac.fullstack.mentor.api.dto.MentorResponse;
import br.senac.fullstack.mentor.domain.DisponibilidadeMentor;
import br.senac.fullstack.mentor.domain.Mentor;
import org.mapstruct.BeanMapping;
import org.mapstruct.Condition;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.NullValuePropertyMappingStrategy;
import org.mapstruct.ReportingPolicy;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.ERROR)
public interface MentorMapper {

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "usuario", ignore = true)
    @Mapping(target = "dataEntradaPlataforma", ignore = true)
    @Mapping(target = "disponibilidades", ignore = true)
    @Mapping(target = "status", ignore = true)
    void atualizarPerfil(
            AtualizarPerfilMentorRequest request,
            @MappingTarget Mentor mentor
    );
    @Condition
    default boolean temConteudo(String valor) {
        return valor != null && !valor.isBlank();
    }

    default Set<DisponibilidadeMentor> toEntities(Set<DisponibilidadeMentorRequest> requests) {
        return requests.stream()
                .map(request -> new DisponibilidadeMentor(request.diaSemana(), request.periodo()))
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }

    DisponibilidadeMentorResponse toResponse(DisponibilidadeMentor disponibilidade);

    @Mapping(target = "usuarioId", source = "usuario.id")
    @Mapping(target = "nome", source = "usuario.nome")
    @Mapping(target = "email", source = "usuario.email")
    @Mapping(target = "biografia", source = "biografia")
    @Mapping(target = "linkedin", source = "linkedin")
    @Mapping(target = "instagram", source = "instagram")
    @Mapping(target = "site", source = "site")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "dataEntradaPlataforma", source = "dataEntradaPlataforma")
    MentorResponse toResponse(Mentor mentor);
}
