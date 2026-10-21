package br.senac.fullstack.shared.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.DefaultCorsProcessor;

import java.io.IOException;

public class JsonCorsProcessor extends DefaultCorsProcessor {
    private final ObjectMapper mapper;

    public JsonCorsProcessor(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @Override
    public boolean processRequest(CorsConfiguration configuration, HttpServletRequest request,
                                  HttpServletResponse response) throws IOException {
        try {
            return super.processRequest(configuration, request, response);
        } catch (IllegalArgumentException | IllegalStateException exception) {
            // Invalid Origin syntax must not escape the security chain as a servlet error.
            rejectRequest(new ServletServerHttpResponse(response));
            return false;
        }
    }

    @Override
    protected void rejectRequest(ServerHttpResponse response) throws IOException {
        SecurityErrors.audit("cors_access_denied");
        response.setStatusCode(HttpStatus.FORBIDDEN);
        response.getHeaders().setContentType(MediaType.APPLICATION_PROBLEM_JSON);
        mapper.writeValue(response.getBody(), SecurityErrors.problem(HttpStatus.FORBIDDEN));
        response.flush();
    }
}
