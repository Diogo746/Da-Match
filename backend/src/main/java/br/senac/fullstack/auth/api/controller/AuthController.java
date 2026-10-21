package br.senac.fullstack.auth.api.controller;

import br.senac.fullstack.auth.api.dto.LoginRequest;
import br.senac.fullstack.auth.api.dto.UsuarioAtualResponse;
import br.senac.fullstack.auth.application.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthService service;

    public AuthController(AuthService service) {
        this.service = service;
    }

    @PostMapping(value = "/login", consumes = MediaType.APPLICATION_JSON_VALUE)
    public UsuarioAtualResponse login(@RequestBody @Valid LoginRequest body,
                                     HttpServletRequest request, HttpServletResponse response) {
        return service.login(body, request, response);
    }

    @GetMapping("/me")
    public UsuarioAtualResponse me() {
        return service.me();
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        service.logout(request, response);
        return ResponseEntity.noContent().build();
    }
}
