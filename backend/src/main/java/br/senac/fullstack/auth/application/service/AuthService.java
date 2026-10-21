package br.senac.fullstack.auth.application.service;

import br.senac.fullstack.auth.api.dto.LoginRequest;
import br.senac.fullstack.auth.api.dto.UsuarioAtualResponse;
import br.senac.fullstack.auth.infrastructure.security.UsuarioPrincipal;
import br.senac.fullstack.shared.security.SecurityErrors;
import br.senac.fullstack.shared.security.SecurityProperties;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contextRepository;
    private final CookieCsrfTokenRepository csrfRepository;
    private final SecurityProperties properties;

    public AuthService(AuthenticationManager authenticationManager, SecurityContextRepository contextRepository,
                       CookieCsrfTokenRepository csrfRepository, SecurityProperties properties) {
        this.authenticationManager = authenticationManager;
        this.contextRepository = contextRepository;
        this.csrfRepository = csrfRepository;
        this.properties = properties;
    }

    public UsuarioAtualResponse login(LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
        try {
            var authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(body.email(), body.senha()));
            new ChangeSessionIdAuthenticationStrategy().onAuthentication(authentication, request, response);
            var context = SecurityContextHolder.createEmptyContext();
            context.setAuthentication(authentication);
            SecurityContextHolder.setContext(context);
            contextRepository.saveContext(context, request, response);
            csrfRepository.saveToken(null, request, response);
            SecurityErrors.audit("login_success");
            return me();
        } catch (AuthenticationException exception) {
            SecurityErrors.audit("login_denied");
            throw exception;
        }
    }

    public UsuarioAtualResponse me() {
        UsuarioPrincipal principal = (UsuarioPrincipal) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        return new UsuarioAtualResponse(principal.getId(), principal.getNome(),
                principal.getUsername(), principal.getTipoUsuario());
    }

    public void logout(HttpServletRequest request, HttpServletResponse response) {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        SecurityContextLogoutHandler handler = new SecurityContextLogoutHandler();
        handler.setSecurityContextRepository(contextRepository);
        handler.logout(request, response, authentication);
        csrfRepository.saveToken(null, request, response);
        response.addHeader(HttpHeaders.SET_COOKIE, ResponseCookie.from("JSESSIONID", "")
                .httpOnly(true).secure(properties.getCookies().isSecure())
                .sameSite(properties.getCookies().getSameSite()).path("/").maxAge(0).build().toString());
        SecurityErrors.audit("logout_success");
    }
}
