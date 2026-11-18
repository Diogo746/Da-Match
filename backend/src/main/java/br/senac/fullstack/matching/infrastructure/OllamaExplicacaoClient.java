package br.senac.fullstack.matching.infrastructure;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.server.ResponseStatusException;

@Component
public class OllamaExplicacaoClient {
    private static final String CAMPO_CONTENT = "content";
    private static final String CAMPO_TEXTO = "texto";
    private static final String CAMPO_REFERENCIAS = "referencias";

    private static final String INSTRUCOES = """
            Escreva em português brasileiro uma explicação de até duas frases para uma startup
            que está avaliando uma indicação de mentoria. Relacione a necessidade da startup
            aos tópicos públicos do mentor. Traduza os códigos dos tópicos para português.
            Retorne JSON com texto e referencias. Use apenas evidências recebidas e cite suas chaves.
            Mencione agenda somente se ela estiver nas evidências. A decisão de iniciar contato é da startup.
            Evite inferir nível de experiência, credenciais, disponibilidade exata ou resultados.
            """;

    private final URI endpoint;
    private final String modelo;
    private final String clientId;
    private final String clientSecret;
    private final ObjectMapper json;
    private final RestClient client;

    @Autowired
    public OllamaExplicacaoClient(ObjectMapper json, @Value("${OLLAMA_BASE_URL:}") String url,
            @Value("${OLLAMA_MODEL:qwen3:4b-instruct}") String modelo,
            @Value("${OLLAMA_CF_ACCESS_CLIENT_ID:}") String clientId,
            @Value("${OLLAMA_CF_ACCESS_CLIENT_SECRET:}") String clientSecret) {
        this(json, url, modelo, clientId, clientSecret, clienteOllama());
    }

    OllamaExplicacaoClient(ObjectMapper json, String url, String modelo, String clientId,
            String clientSecret, RestClient client) {
        this.json = json;
        this.endpoint = configurarEndpoint(url, clientId, clientSecret);
        this.modelo = modelo.strip();
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.client = client;
    }

    private static RestClient clienteOllama() {
        var http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NEVER).build();
        var factory = new JdkClientHttpRequestFactory(http);
        factory.setReadTimeout(Duration.ofSeconds(28));
        return RestClient.builder().requestFactory(factory).build();
    }

    private static URI configurarEndpoint(String url, String clientId, String clientSecret) {
        if (url.isBlank()) {
            return null;
        }
        URI base = URI.create(url.strip());
        if (base.getHost() == null || base.getUserInfo() != null || base.getRawQuery() != null
                || base.getRawFragment() != null || !List.of("", "/").contains(base.getRawPath())) {
            throw new IllegalArgumentException("OLLAMA_BASE_URL deve conter somente protocolo, host e porta opcional.");
        }
        if ("http".equalsIgnoreCase(base.getScheme())) {
            boolean local = List.of("localhost", "127.0.0.1", "[::1]").contains(base.getHost());
            if (!local || !clientId.isBlank() || !clientSecret.isBlank()) {
                throw new IllegalArgumentException("HTTP do Ollama requer endereço loopback sem credenciais.");
            }
        } else if (!"https".equalsIgnoreCase(base.getScheme()) || clientId.isBlank() || clientSecret.isBlank()) {
            throw new IllegalArgumentException("O Ollama remoto requer HTTPS e as duas credenciais do Cloudflare Access.");
        }
        return base.resolve("/api/chat");
    }

    public Explicacao explicar(Map<String, String> evidencias) {
        if (endpoint == null || modelo.isBlank() || evidencias.isEmpty()) {
            throw indisponivel();
        }
        try {
            var chamada = client.post().uri(endpoint).contentType(MediaType.APPLICATION_JSON);
            if (!clientId.isBlank()) {
                chamada.header("CF-Access-Client-Id", clientId).header("CF-Access-Client-Secret", clientSecret);
            }
            JsonNode resposta = chamada.body(Map.of("model", modelo, "stream", false, "keep_alive", "30m",
                            "messages", List.of(Map.of("role", "system", CAMPO_CONTENT, INSTRUCOES),
                                    Map.of("role", "user", CAMPO_CONTENT, json.writeValueAsString(evidencias))),
                            "options", Map.of("temperature", 0, "num_ctx", 2048, "num_predict", 256),
                            "format", formato(evidencias)))
                    .retrieve().body(JsonNode.class);
            if (resposta == null || !resposta.path("done").asBoolean()
                    || !resposta.path("done_reason").asText().equals("stop")) {
                throw indisponivel();
            }
            return lerExplicacao(json.readTree(resposta.path("message").path(CAMPO_CONTENT).asText()), evidencias);
        } catch (RestClientException | JsonProcessingException ex) {
            throw indisponivel();
        }
    }

    private Map<String, Object> formato(Map<String, String> evidencias) {
        return Map.of("type", "object", "additionalProperties", false, "required", List.of(CAMPO_TEXTO, CAMPO_REFERENCIAS),
                "properties", Map.of(CAMPO_TEXTO, Map.of("type", "string"),
                        CAMPO_REFERENCIAS, Map.of("type", "array", "items",
                                Map.of("type", "string", "enum", List.copyOf(evidencias.keySet())))));
    }

    private Explicacao lerExplicacao(JsonNode resposta, Map<String, String> evidencias) {
        if (resposta == null || !resposta.path(CAMPO_TEXTO).isTextual() || !resposta.path(CAMPO_REFERENCIAS).isArray()) {
            throw indisponivel();
        }
        String texto = resposta.path(CAMPO_TEXTO).asText().strip();
        List<String> referencias = new ArrayList<>();
        for (JsonNode referencia : resposta.path(CAMPO_REFERENCIAS)) {
            String id = referencia.asText();
            if (!evidencias.containsKey(id)) {
                throw indisponivel();
            }
            referencias.add(id);
        }
        if (texto.isBlank() || texto.length() > 700 || referencias.stream().noneMatch(id -> !id.equals("AGENDA"))) {
            throw indisponivel();
        }
        return new Explicacao(texto, referencias.stream().distinct().toList());
    }

    private ResponseStatusException indisponivel() {
        return new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE);
    }

    public record Explicacao(String texto, List<String> referencias) { }
}
