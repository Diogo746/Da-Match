package br.senac.fullstack.matching.api.controller;

import br.senac.fullstack.matching.application.service.MatchingService;
import br.senac.fullstack.matching.infrastructure.OllamaExplicacaoClient;
import br.senac.fullstack.matching.infrastructure.OllamaExplicacaoClient.Explicacao;
import java.util.UUID;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ExplicacaoMatchingController {
    private final MatchingService matching;
    private final OllamaExplicacaoClient modelo;

    public ExplicacaoMatchingController(MatchingService matching, OllamaExplicacaoClient modelo) {
        this.matching = matching;
        this.modelo = modelo;
    }

    @PostMapping("/api/v1/startups/{startupId}/recomendacoes/{mentorId}/explicacao")
    public Explicacao explicar(@PathVariable("startupId") UUID startupId, @PathVariable("mentorId") UUID mentorId) {
        return modelo.explicar(matching.evidenciasIndicacao(startupId, mentorId));
    }
}
