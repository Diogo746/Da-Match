package br.senac.fullstack.auth.api.dto;

import br.senac.fullstack.shared.enums.TipoUsuario;

import java.util.UUID;

public record UsuarioAtualResponse(UUID id, String nome, String email, TipoUsuario tipoUsuario) {
}
