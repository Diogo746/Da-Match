package br.senac.fullstack.matching.infrastructure;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatExceptionOfType;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.headerDoesNotExist;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OllamaExplicacaoClientTest {
    private static final String LOCAL = "http://127.0.0.1:11434";
    private static final String REMOTO = "https://ollama.example.com";
    private static final Map<String, String> EVIDENCIAS = Map.of("VALIDATION", "Tópico público em comum");
    private final ObjectMapper json = new ObjectMapper();
    private final RestClient.Builder builder = RestClient.builder();
    private final MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();

    @Test
    void devolveExplicacaoComReferenciaEnviadaViaTunel() throws Exception {
        var client = cliente(REMOTO, "id-teste", "segredo-teste");
        server.expect(requestTo(REMOTO + "/api/chat")).andExpect(method(HttpMethod.POST))
                .andExpect(header("CF-Access-Client-Id", "id-teste"))
                .andExpect(header("CF-Access-Client-Secret", "segredo-teste"))
                .andExpect(jsonPath("$.model").value("qwen3:4b-instruct"))
                .andExpect(jsonPath("$.stream").value(false))
                .andExpect(jsonPath("$.format.properties.referencias.items.enum[0]").value("VALIDATION"))
                .andExpect(jsonPath("$.messages[1].role").value("user"))
                .andRespond(withSuccess(resposta("VALIDATION", "stop"), MediaType.APPLICATION_JSON));

        var resultado = client.explicar(EVIDENCIAS);
        assertThat(resultado.texto()).isEqualTo("A startup e o mentor têm validação em comum.");
        assertThat(resultado.referencias()).containsExactly("VALIDATION");
        server.verify();
    }

    @Test
    void consultaLoopbackSemCredenciais() throws Exception {
        var client = cliente(LOCAL, "", "");
        server.expect(requestTo(LOCAL + "/api/chat"))
                .andExpect(headerDoesNotExist("CF-Access-Client-Secret"))
                .andRespond(withSuccess(resposta("VALIDATION", "stop"), MediaType.APPLICATION_JSON));
        assertThat(client.explicar(EVIDENCIAS).referencias()).containsExactly("VALIDATION");
        server.verify();
    }

    @Test
    void rejeitaReferenciaQueNaoFoiEnviada() throws Exception {
        var client = cliente(LOCAL, "", "");
        server.expect(requestTo(LOCAL + "/api/chat"))
                .andRespond(withSuccess(resposta("AGENDA", "stop"), MediaType.APPLICATION_JSON));

        assertThatExceptionOfType(ResponseStatusException.class)
                .isThrownBy(() -> client.explicar(EVIDENCIAS))
                .satisfies(ex -> assertThat(ex.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE));
        server.verify();
    }

    @Test
    void rejeitaGeracaoInterrompida() throws Exception {
        var client = cliente(LOCAL, "", "");
        server.expect(requestTo(LOCAL + "/api/chat"))
                .andRespond(withSuccess(resposta("VALIDATION", "length"), MediaType.APPLICATION_JSON));
        assertThatExceptionOfType(ResponseStatusException.class).isThrownBy(() -> client.explicar(EVIDENCIAS));
        server.verify();
    }

    @Test
    void exigeHttpsEAsDuasCredenciaisParaAcessoRemoto() {
        assertThatExceptionOfType(IllegalArgumentException.class)
                .isThrownBy(() -> cliente("http://ollama.example.com", "id-teste", "segredo-teste"));
        assertThatExceptionOfType(IllegalArgumentException.class)
                .isThrownBy(() -> cliente(REMOTO, "id-teste", ""));
        server.verify();
    }

    private OllamaExplicacaoClient cliente(String base, String id, String segredo) {
        return new OllamaExplicacaoClient(json, base, "qwen3:4b-instruct", id, segredo, builder.build());
    }

    private String resposta(String referencia, String motivo) throws Exception {
        String text = json.writeValueAsString(Map.of("texto", "A startup e o mentor têm validação em comum.",
                "referencias", List.of(referencia)));
        return json.writeValueAsString(Map.of("done", true, "done_reason", motivo,
                "message", Map.of("role", "assistant", "content", text)));
    }
}
