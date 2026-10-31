package br.senac.fullstack.shared.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:hibernate-startup-publication;MODE=PostgreSQL;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=update", "spring.sql.init.mode=always",
        "spring.sql.init.schema-locations=classpath:fixtures/legacy-mentor-schema.sql,"
                + "classpath:fixtures/legacy-startup-schema.sql"
})
class HibernateStartupPublicationSchemaTest {
    @Autowired private JdbcTemplate jdbc;

    @Test
    void addsRequiredTextualDefaultToPopulatedStartupAndPreservesFounderAndValidation() {
        assertThat(jdbc.queryForObject("SELECT status FROM startup", String.class)).isEqualTo("RASCUNHO");
        assertThat(jdbc.queryForObject("SELECT nome_provisorio FROM startup", String.class)).isEqualTo("Projeto legado");
        assertThat(jdbc.queryForObject("SELECT status_validacao FROM startup", String.class)).isEqualTo("PESQUISA_MERCADO");
        assertThat(jdbc.queryForObject("SELECT papel_membro FROM membros_da_startup", String.class)).isEqualTo("FUNDADOR");
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM usuario", Integer.class)).isEqualTo(2);
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM perfil_match", Integer.class)).isZero();
        assertThat(jdbc.queryForObject("""
                SELECT column_default FROM information_schema.columns
                WHERE table_name = 'STARTUP' AND column_name = 'STATUS'
                """, String.class)).isEqualTo("'RASCUNHO'");
        assertThat(jdbc.queryForObject("""
                SELECT is_nullable FROM information_schema.columns
                WHERE table_name = 'STARTUP' AND column_name = 'STATUS'
                """, String.class)).isEqualTo("NO");
    }
}
