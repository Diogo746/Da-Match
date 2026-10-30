package br.senac.fullstack.startup.api.mapper;

import br.senac.fullstack.startup.api.dto.MembroStartupResponse;
import br.senac.fullstack.startup.api.dto.StartupResponse;
import br.senac.fullstack.startup.api.dto.PublicacaoStartupResponse;
import br.senac.fullstack.startup.domain.PendenciaPublicacaoStartup;
import br.senac.fullstack.startup.domain.MembroStartup;
import br.senac.fullstack.startup.domain.Startup;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface StartupMapper {

    StartupResponse toResponse(Startup startup);

    @Mapping(source = "startup.id", target = "startupId")
    PublicacaoStartupResponse toPublicacaoResponse(Startup startup, boolean aptoParaPublicacao,
            boolean podeGerenciar, List<PendenciaPublicacaoStartup> pendencias);

    @Mapping(source = "usuario.id", target = "usuarioId")
    @Mapping(source = "usuario.nome", target = "nomeUsuario")
    MembroStartupResponse toResponse(MembroStartup membroStartup);
}
