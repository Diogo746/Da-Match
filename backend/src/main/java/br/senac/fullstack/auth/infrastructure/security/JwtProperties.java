package br.senac.fullstack.auth.infrastructure.security;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.Map;

@Getter
@Setter
@ConfigurationProperties("app.security.jwt")
public class JwtProperties {
    private String issuer;
    private String audience;
    private String activeKeyId;
    private String privateKey;
    private Map<String, String> publicKeys = Map.of();
    private Duration accessTtl = Duration.ofMinutes(15);
    private Duration refreshTtl = Duration.ofMinutes(30);
    private Duration absoluteTtl = Duration.ofHours(8);

    public void validatePolicy() {
        if (issuer == null || issuer.isBlank() || audience == null || audience.isBlank()
                || activeKeyId == null || !activeKeyId.matches("[A-Za-z0-9_-]{1,64}")
                || publicKeys == null || publicKeys.isEmpty() || publicKeys.size() > 5
                || accessTtl == null || accessTtl.compareTo(Duration.ofMinutes(1)) < 0
                || accessTtl.compareTo(Duration.ofMinutes(15)) > 0
                || refreshTtl == null || refreshTtl.compareTo(accessTtl) < 0
                || refreshTtl.compareTo(Duration.ofMinutes(30)) > 0
                || absoluteTtl == null || absoluteTtl.compareTo(refreshTtl) < 0
                || absoluteTtl.compareTo(Duration.ofHours(8)) > 0) {
            throw new IllegalStateException("Configuração JWT ausente ou política de duração inválida.");
        }
    }
}
