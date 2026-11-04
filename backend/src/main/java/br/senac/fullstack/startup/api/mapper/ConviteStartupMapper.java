package br.senac.fullstack.startup.api.mapper;

import br.senac.fullstack.startup.api.dto.ConviteStartupResponse;
import br.senac.fullstack.startup.domain.ConviteStartup;
import br.senac.fullstack.startup.domain.enums.StatusConviteStartup;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface ConviteStartupMapper {
    @Mapping(source = "convite.id", target = "id")
    @Mapping(source = "convite.startup.id", target = "startupId")
    @Mapping(source = "convite.startup.nomeProvisorio", target = "nomeStartup")
    @Mapping(source = "convite.emissor.nome", target = "nomeConvidante")
    @Mapping(source = "convite.destinatario.nome", target = "nomeDestinatario")
    @Mapping(source = "status", target = "status")
    ConviteStartupResponse toResponse(ConviteStartup convite, StatusConviteStartup status);
}
