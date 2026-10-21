package br.senac.fullstack.mentor.api.controller;

import br.senac.fullstack.mentor.api.dto.AtualizarStatusPerfilMentorRequest;
import br.senac.fullstack.mentor.api.dto.AtualizarPerfilMentorRequest;
import br.senac.fullstack.mentor.api.dto.CadastrarMentorRequest;
import br.senac.fullstack.mentor.api.dto.MentorResponse;
import br.senac.fullstack.mentor.application.service.MentorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/mentores")
public class MentorController {

    private final MentorService mentorService;

    public MentorController(MentorService mentorService) {
        this.mentorService = mentorService;
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MentorResponse> cadastrarMentor(@RequestBody @Valid CadastrarMentorRequest request) {
        MentorResponse mentorCriado = mentorService.criarMentor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(mentorCriado);
    }

    @PatchMapping(value = "/{mentorId}/status", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MentorResponse> atualizarStatus(
            @PathVariable("mentorId") UUID mentorId,
            @RequestBody @Valid AtualizarStatusPerfilMentorRequest request
    ) {
        return ResponseEntity.ok(mentorService.atualizarStatus(mentorId, request));
    }

    @PatchMapping(value = "/{mentorId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<MentorResponse> atualizarPerfil(
            @PathVariable("mentorId") UUID mentorId,
            @RequestBody @Valid AtualizarPerfilMentorRequest request
    ) {
        return ResponseEntity.ok(mentorService.atualizarPerfil(mentorId, request));
    }

}
