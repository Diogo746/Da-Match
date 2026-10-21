package br.senac.fullstack.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ProblemDetail;

import java.io.IOException;

public final class SecurityErrors {
    private static final Logger AUDIT = LoggerFactory.getLogger("security.audit");

    private SecurityErrors() {
    }

    public static void audit(String event) {
        // Only application-defined event names: no credentials, paths, user input or session IDs.
        AUDIT.info("event={} outcome={}", event, event.endsWith("success") ? "success" : "denied");
    }

    public static ProblemDetail problem(HttpStatus status) {
        String detail = switch (status) {
            case BAD_REQUEST -> "Dados da requisição inválidos.";
            case UNAUTHORIZED -> "Autenticação necessária ou credenciais inválidas.";
            case FORBIDDEN -> "Acesso negado ou token CSRF inválido.";
            case NOT_FOUND -> "Recurso não encontrado.";
            case CONFLICT -> "A operação conflita com os dados ou regras existentes.";
            case UNSUPPORTED_MEDIA_TYPE -> "Envie o corpo em application/json.";
            case METHOD_NOT_ALLOWED -> "Método não permitido.";
            default -> "Não foi possível processar a solicitação.";
        };
        return ProblemDetail.forStatusAndDetail(status, detail);
    }

    public static void write(HttpServletResponse response, HttpStatus status, ObjectMapper mapper) throws IOException {
        audit(status == HttpStatus.UNAUTHORIZED ? "authentication_denied" : "access_denied");
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_PROBLEM_JSON_VALUE);
        mapper.writeValue(response.getOutputStream(), problem(status));
    }
}
