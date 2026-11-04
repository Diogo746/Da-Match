package br.senac.fullstack.startup.api.dto;

import java.util.List;

public record PaginaConvitesStartupResponse(List<ConviteStartupResponse> itens, int pagina, int tamanho,
        long totalItens, int totalPaginas) { }
