package br.senac.fullstack.startup.domain;

import java.io.Serializable;

public record PendenciaPublicacaoStartup(String codigo, String campo, String mensagem) implements Serializable {
}
