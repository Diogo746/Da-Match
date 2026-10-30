package br.senac.fullstack.shared.api.error;

import br.senac.fullstack.mentor.application.exception.MentorNaoEncontradoException;
import br.senac.fullstack.shared.security.SecurityErrors;
import br.senac.fullstack.startup.application.exception.StartupIncompletaException;
import br.senac.fullstack.usuario.application.exception.EmailExistenteException;
import br.senac.fullstack.usuario.application.exception.UsuarioNaoEncontradoException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(MethodArgumentNotValidException exception,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        ProblemDetail problem = SecurityErrors.problem(HttpStatus.BAD_REQUEST);
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                fields.putIfAbsent(error.getField(), error.getDefaultMessage()));
        problem.setProperty("fields", fields);
        return new ResponseEntity<>(problem, headers, status);
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(Exception exception, Object body,
            HttpHeaders headers, HttpStatusCode status, WebRequest request) {
        return new ResponseEntity<>(SecurityErrors.problem(HttpStatus.valueOf(status.value())), headers, status);
    }

    @ExceptionHandler(AuthenticationException.class)
    public ProblemDetail authentication() {
        return SecurityErrors.problem(HttpStatus.UNAUTHORIZED);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail denied() {
        SecurityErrors.audit("resource_access_denied");
        return SecurityErrors.problem(HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler({NoSuchElementException.class, MentorNaoEncontradoException.class,
            UsuarioNaoEncontradoException.class})
    public ProblemDetail notFound() {
        return SecurityErrors.problem(HttpStatus.NOT_FOUND);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail badRequest() {
        return SecurityErrors.problem(HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(StartupIncompletaException.class)
    public ProblemDetail startupIncompleta(StartupIncompletaException exception) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT,
                "A startup possui pendências para publicação.");
        problem.setProperty("codigo", "STARTUP_INCOMPLETA");
        problem.setProperty("pendencias", exception.getPendencias());
        return problem;
    }

    @ExceptionHandler({IllegalStateException.class, EmailExistenteException.class, DataIntegrityViolationException.class})
    public ProblemDetail conflict() {
        return SecurityErrors.problem(HttpStatus.CONFLICT);
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail unexpected() {
        return SecurityErrors.problem(HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
