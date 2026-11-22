package br.senac.fullstack.salvos.api.dto;

import br.senac.fullstack.descoberta.api.dto.PerfilDescobertaResponse;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PaginaSalvosResponse(List<Item> itens, int pagina, int tamanho, long totalItens, int totalPaginas) {
    public record Item(UUID perfilId, Instant salvoEm, PerfilDescobertaResponse perfil) { }
}
