package br.senac.fullstack.descoberta.application.service;

import br.senac.fullstack.descoberta.api.dto.PaginaPerfisDescobertaResponse;
import br.senac.fullstack.descoberta.api.dto.PerfilDescobertaResponse;
import br.senac.fullstack.descoberta.api.mapper.DescobertaMapper;
import br.senac.fullstack.descoberta.domain.FiltrosDescoberta;
import br.senac.fullstack.descoberta.domain.PerfilDescoberta;
import br.senac.fullstack.descoberta.domain.TextoDescoberta;
import br.senac.fullstack.descoberta.infrastructure.query.DescobertaQueryRepository;
import br.senac.fullstack.shared.enums.TipoUsuario;
import br.senac.fullstack.shared.security.ResourceAccess;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
public class DescobertaService {
    private final DescobertaQueryRepository consultas;
    private final ElegibilidadeDescobertaService elegibilidade;
    private final DescobertaMapper mapper;
    private final ResourceAccess access;

    public DescobertaService(DescobertaQueryRepository consultas, ElegibilidadeDescobertaService elegibilidade,
            DescobertaMapper mapper, ResourceAccess access) {
        this.consultas = consultas;
        this.elegibilidade = elegibilidade;
        this.mapper = mapper;
        this.access = access;
    }

    public PaginaPerfisDescobertaResponse listar(TipoUsuario tipo, Map<String, List<String>> parametros) {
        exigirLeitor(tipo);
        FiltrosDescoberta filtros = FiltrosDescoberta.ler(parametros, tipo);
        List<PerfilDescoberta> perfis = consultas.consultar(tipo, filtros, null).stream()
                .map(questionario -> elegibilidade.avaliar(questionario, tipo)).flatMap(Optional::stream)
                .filter(filtros::inclui)
                .sorted(Comparator.comparing((PerfilDescoberta perfil) -> TextoDescoberta.normalizar(perfil.nome()))
                        .thenComparing(perfil -> perfil.id().toString())).toList();
        long inicio = (long) filtros.pagina() * filtros.tamanho();
        List<PerfilDescobertaResponse> itens = perfis.stream().skip(inicio).limit(filtros.tamanho())
                .map(mapper::toResponse).toList();
        int paginas = (int) ((perfis.size() + (long) filtros.tamanho() - 1) / filtros.tamanho());
        return new PaginaPerfisDescobertaResponse(itens, filtros.pagina(), filtros.tamanho(), perfis.size(), paginas);
    }

    public PerfilDescobertaResponse detalhar(TipoUsuario tipo, UUID id, Map<String, List<String>> parametros) {
        exigirLeitor(tipo);
        if (id == null) {
            throw new IllegalArgumentException("Identificador obrigatório.");
        }
        FiltrosDescoberta.validarParametros(parametros, Set.of());
        var filtros = FiltrosDescoberta.ler(Map.of(), tipo);
        return consultas.consultar(tipo, filtros, id).stream()
                .map(questionario -> elegibilidade.avaliar(questionario, tipo)).flatMap(Optional::stream)
                .map(mapper::toResponse).findFirst().orElseThrow(NoSuchElementException::new);
    }

    private void exigirLeitor(TipoUsuario tipo) {
        if (tipo == TipoUsuario.MENTOR) {
            access.currentStartupUserId();
            return;
        }
        if (tipo == TipoUsuario.STARTUP) {
            access.currentMentorUserId();
            return;
        }
        throw new IllegalArgumentException("Tipo de catálogo inválido.");
    }
}
