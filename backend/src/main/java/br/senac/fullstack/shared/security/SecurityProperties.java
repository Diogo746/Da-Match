package br.senac.fullstack.shared.security;

import jakarta.validation.Valid;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.net.URI;
import java.util.List;

@Getter
@Setter
@Validated
@ConfigurationProperties("app.security")
public class SecurityProperties {
    @Valid
    private Cors cors = new Cors();
    @Valid
    private Cookies cookies = new Cookies();

    @Getter
    @Setter
    public static class Cors {
        @NotEmpty
        private List<String> allowedOrigins = List.of("http://localhost:4200");

        @AssertTrue(message = "Configure somente origens HTTP(S) exatas, sem caminho, credenciais ou curingas.")
        public boolean isExactOrigins() {
            return allowedOrigins != null && allowedOrigins.stream().allMatch(this::isExactOrigin);
        }

        private boolean isExactOrigin(String value) {
            try {
                URI uri = URI.create(value);
                return !value.contains("*") && uri.getHost() != null && uri.getRawUserInfo() == null
                        && ("http".equals(uri.getScheme()) || "https".equals(uri.getScheme()))
                        && (uri.getRawPath() == null || uri.getRawPath().isEmpty())
                        && uri.getRawQuery() == null && uri.getRawFragment() == null
                        && uri.getPort() >= -1 && uri.getPort() <= 65535;
            } catch (IllegalArgumentException | NullPointerException exception) {
                return false;
            }
        }
    }

    @Getter
    @Setter
    public static class Cookies {
        private boolean secure;
        @Pattern(regexp = "Lax|Strict|None")
        private String sameSite = "Lax";

        @AssertTrue(message = "SameSite=None exige cookies Secure.")
        public boolean isSecureSameSite() {
            return !"None".equals(sameSite) || secure;
        }
    }
}
