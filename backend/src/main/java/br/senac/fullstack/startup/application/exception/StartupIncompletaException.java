package br.senac.fullstack.startup.application.exception;

import br.senac.fullstack.startup.domain.PendenciaPublicacaoStartup;

import java.util.List;

public class StartupIncompletaException extends RuntimeException {
    private final List<PendenciaPublicacaoStartup> pendencias;

    public StartupIncompletaException(List<PendenciaPublicacaoStartup> pendencias) {
        super("A startup possui pendências para publicação.");
        this.pendencias = List.copyOf(pendencias);
    }

    public List<PendenciaPublicacaoStartup> getPendencias() {
        return pendencias;
    }
}
