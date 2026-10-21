package br.senac.fullstack.shared.security;

import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.validation.ValidationAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.mock.env.MockEnvironment;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecurityPropertiesTest {
    @Test
    void invalidEnvironmentConfigurationPreventsStartup() {
        ApplicationContextRunner context = new ApplicationContextRunner()
                .withConfiguration(AutoConfigurations.of(ValidationAutoConfiguration.class))
                .withUserConfiguration(PropertiesConfiguration.class);
        for (String value : List.of("", "*", "https://*.example.test")) {
            context.withPropertyValues("app.security.cors.allowed-origins=" + value)
                    .run(application -> assertThat(application).hasFailed());
        }
        context.withPropertyValues("app.security.cookies.same-site=None", "app.security.cookies.secure=false")
                .run(application -> assertThat(application).hasFailed());
        context.withPropertyValues("app.security.cors.allowed-origins=https://frontend.example.test",
                        "app.security.cookies.same-site=None", "app.security.cookies.secure=true")
                .run(application -> assertThat(application).hasNotFailed());
    }

    @Test
    void productionRejectsInsecureCookiesBeforeBuildingTheFilterChain() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("prod");
        assertThatThrownBy(() -> new SecurityConfig().securityFilterChain(
                null, null, null, new SecurityProperties(), environment, null))
                .isInstanceOf(IllegalStateException.class).hasMessage("Produção exige cookies Secure.");
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(SecurityProperties.class)
    static class PropertiesConfiguration {
    }

    @Test
    void acceptsOnlyExactOriginsAndRequiresSecureForSameSiteNone() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            SecurityProperties properties = new SecurityProperties();
            assertThat(validator.validate(properties)).isEmpty();
            for (String invalid : List.of("*", "https://*.example.test", "https://example.test/path",
                    "https://user:password@example.test", "null", "https://example.test?query=value")) {
                properties.getCors().setAllowedOrigins(List.of(invalid));
                assertThat(validator.validate(properties)).isNotEmpty();
            }
            properties.getCors().setAllowedOrigins(List.of());
            assertThat(validator.validate(properties)).isNotEmpty();
            properties.getCors().setAllowedOrigins(List.of("https://frontend.example.test"));
            properties.getCookies().setSameSite("None");
            assertThat(validator.validate(properties)).isNotEmpty();
            properties.getCookies().setSecure(true);
            assertThat(validator.validate(properties)).isEmpty();
        }
    }
}
