package br.senac.fullstack.descoberta.api.mapper;

import br.senac.fullstack.descoberta.api.dto.PerfilDescobertaResponse;
import br.senac.fullstack.descoberta.domain.PerfilDescoberta;
import org.springframework.stereotype.Component;

@Component
public class DescobertaMapper {
    public PerfilDescobertaResponse toResponse(PerfilDescoberta perfil) {
        return new PerfilDescobertaResponse(perfil.id(), perfil.tipo(), perfil.nome(), perfil.apresentacao(),
                perfil.setores(), perfil.topicos(), perfil.formato(), perfil.cidadeId());
    }
}
