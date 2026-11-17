package br.senac.fullstack.matching.domain;

import java.math.BigDecimal;
import java.util.List;

public record ResultadoMatching(List<String> impedimentos, BigDecimal nota, Contribuicoes contribuicoes,
        int necessidadesAtendidas, int necessidadesPraticas, boolean agendaEmComum) {
    public ResultadoMatching {
        impedimentos = List.copyOf(impedimentos);
    }

    public boolean elegivel() {
        return impedimentos.isEmpty();
    }

    public boolean indicado() {
        return elegivel() && nota.compareTo(RegraMentoria.CORTE) >= 0;
    }

    public boolean superDamatch() {
        return indicado() && nota.compareTo(RegraMentoria.SELO) >= 0;
    }

    public record Contribuicoes(BigDecimal necessidades, BigDecimal setor, BigDecimal momento,
            BigDecimal publico, BigDecimal agenda, BigDecimal formacao) {
        public BigDecimal total() {
            return necessidades.add(setor).add(momento).add(publico).add(agenda).add(formacao);
        }
    }
}
