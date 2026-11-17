package br.senac.fullstack.matching.domain;

import java.util.Comparator;

public record CandidatoMatching(PerfilMatching perfil, ResultadoMatching resultado) {
    public static Comparator<CandidatoMatching> ordem() {
        return Comparator.comparing((CandidatoMatching item) -> item.resultado().nota()).reversed()
                .thenComparing(item -> item.resultado().necessidadesAtendidas(), Comparator.reverseOrder())
                .thenComparing(item -> item.resultado().necessidadesPraticas(), Comparator.reverseOrder())
                .thenComparing(item -> item.resultado().agendaEmComum(), Comparator.reverseOrder())
                .thenComparing(item -> item.perfil().perfil().id().toString());
    }
}
