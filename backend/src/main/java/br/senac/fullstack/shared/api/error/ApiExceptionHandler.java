package br.senac.fullstack.shared.api.error;

import br.senac.fullstack.mentor.application.exception.MentorNaoEncontradoException;
import br.senac.fullstack.shared.security.SecurityErrors;
import br.senac.fullstack.startup.application.exception.StartupIncompletaException;
import br.senac.fullstack.startup.application.exception.ConviteStartupException;
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

    @ExceptionHandler(ConviteStartupException.class)
    public ProblemDetail convite(ConviteStartupException exception) {
        HttpStatus status = switch (exception.getCodigo()) {
            case CONVITE_EXPIRADO, CONVITE_OBRIGATORIO -> HttpStatus.GONE;
            case DESTINATARIO_INDISPONIVEL -> HttpStatus.NOT_FOUND;
            default -> HttpStatus.CONFLICT;
        };
        String detail = switch (exception.getCodigo()) {
            case CONVITE_EXPIRADO -> "O convite venceu. Solicite um novo convite.";
            case CONVITE_OBRIGATORIO -> "A inclusão de integrantes exige convite e aceite.";
            case DESTINATARIO_INDISPONIVEL -> "Não foi possível convidar essa conta.";
            default -> "Não foi possível concluir esta ação de convite. Recarregue os dados.";
        };
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setProperty("codigo", exception.getCodigo().name());
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
