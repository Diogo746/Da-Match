package br.senac.fullstack.descoberta.api.dto;

import java.util.List;

public record PaginaPerfisDescobertaResponse(List<PerfilDescobertaResponse> itens, int pagina,
        int tamanho, long totalItens, int totalPaginas) { }
