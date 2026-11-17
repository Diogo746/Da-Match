package br.senac.fullstack.matching.api.controller;

import br.senac.fullstack.matching.api.dto.RecomendacoesResponse;
import br.senac.fullstack.matching.api.dto.RelatorioMatchingResponse;
import br.senac.fullstack.matching.application.service.MatchingService;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
public class MatchingController {
    private final MatchingService service;

    public MatchingController(MatchingService service) {
        this.service = service;
    }

    @GetMapping("/api/v1/startups/{startupId}/recomendacoes")
    public RecomendacoesResponse paraStartup(@PathVariable("startupId") UUID startupId,
            @RequestParam MultiValueMap<String, String> parametros) {
        return service.paraStartup(startupId, parametros);
    }

    @GetMapping("/api/v1/mentores/me/recomendacoes")
    public RecomendacoesResponse paraMentor(@RequestParam MultiValueMap<String, String> parametros) {
        return service.paraMentor(parametros);
    }

    @GetMapping("/api/v1/admin/matching/startups/{startupId}/mentores/{mentorId}")
    public RelatorioMatchingResponse relatorio(@PathVariable("startupId") UUID startupId,
            @PathVariable("mentorId") UUID mentorId, @RequestParam MultiValueMap<String, String> parametros) {
        return service.relatorio(startupId, mentorId, parametros);
    }
}
