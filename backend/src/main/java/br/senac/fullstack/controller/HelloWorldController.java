package br.senac.fullstack.controller;

import br.senac.fullstack.dto.HelloWorldDTO;
import br.senac.fullstack.service.HelloWorldService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/hello")
public class HelloWorldController {

    private final HelloWorldService helloWorldService;

    public HelloWorldController(HelloWorldService helloWorldService) {
        this.helloWorldService = helloWorldService;
    }

    @GetMapping
    public ResponseEntity<HelloWorldDTO> sayHello(@RequestParam(name = "name", required = false) String name) {
        return ResponseEntity.ok(helloWorldService.getGreeting(name));
    }
}
