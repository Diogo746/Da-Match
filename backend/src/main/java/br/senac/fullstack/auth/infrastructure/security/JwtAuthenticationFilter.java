package br.senac.fullstack.auth.infrastructure.security;

import br.senac.fullstack.auth.application.service.JwtSessionService;
import br.senac.fullstack.shared.security.SecurityErrors;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public final class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtTokenCodec codec;
    private final JwtSessionService sessions;
    private final JwtCookies cookies;
    private final ObjectMapper mapper;

    public JwtAuthenticationFilter(JwtTokenCodec codec, JwtSessionService sessions, JwtCookies cookies, ObjectMapper mapper) {
        this.codec = codec;
        this.sessions = sessions;
        this.cookies = cookies;
        this.mapper = mapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        response.setHeader(JwtCookies.MODE_HEADER, "JWT");
        String token = cookies.read(request, JwtCookies.ACCESS);
        if (token != null) {
            try {
                var identity = codec.verify(token);
                var principal = sessions.authenticate(identity);
                var context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(UsernamePasswordAuthenticationToken.authenticated(
                        principal, null, principal.getAuthorities()));
                SecurityContextHolder.setContext(context);
                request.setAttribute(JwtCookies.IDENTITY_ATTRIBUTE, identity);
                response.setHeader(JwtCookies.MODE_HEADER, "JWT");
                response.setHeader(JwtCookies.EXPIRY_HEADER, identity.expiresAt().toString());
            } catch (JwtException | BadCredentialsException | IllegalArgumentException exception) {
                // Keep the anonymous context installed by Spring. No HttpSession or
                // alternative authentication source is loaded in JWT mode.
                SecurityErrors.audit("jwt_denied");
            } catch (DataAccessException exception) {
                SecurityErrors.write(response, HttpStatus.SERVICE_UNAVAILABLE, mapper);
                return;
            }
        }
        chain.doFilter(request, response);
    }
}
