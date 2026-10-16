package br.senac.fullstack.mentor.api.controller;

import br.senac.fullstack.mentor.api.dto.CadastrarMentorRequest;
import br.senac.fullstack.mentor.api.dto.MentorResponse;
import br.senac.fullstack.mentor.application.service.MentorService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/mentores")
public class MentorController {

    private final MentorService mentorService;

    public MentorController(MentorService mentorService) {
        this.mentorService = mentorService;
    }

    @PostMapping
    public ResponseEntity<MentorResponse> cadastrarMentor(@RequestBody @Valid CadastrarMentorRequest request) {
        MentorResponse mentorCriado = mentorService.criarMentor(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(mentorCriado);
    }
}
