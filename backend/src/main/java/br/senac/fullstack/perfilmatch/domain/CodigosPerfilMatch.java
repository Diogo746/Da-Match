package br.senac.fullstack.perfilmatch.domain;

public final class CodigosPerfilMatch {
    private CodigosPerfilMatch() { }

    public enum Momento { PROBLEM, AUDIENCE, SOLUTION, VALIDATING }
    public enum Setor {
        TECH, HEALTH, EDUCATION, AGRO, SOCIAL, ENVIRONMENT, FINANCE, INSURANCE, COMMERCE, FOOD,
        LOGISTICS, REAL_ESTATE, LEGAL, WORK, MARKETING, INDUSTRY, TOURISM, CREATIVE, GAMES,
        FASHION, SPORTS, PETS, GOVERNMENT, GENERAL, DISCOVERING
    }
    public enum Topico {
        VALIDATION, CUSTOMERS, BUSINESS, PROTOTYPE, PRICING, PITCH, TECHNOLOGY, DESIGN,
        MARKETING, FIRST_CUSTOMERS, LEGAL, PARTNERS, GRANTS, ORGANIZATION
    }
    public enum Experiencia { PRACTICAL, KNOWLEDGE }
    public enum Publico { B2C, B2B, B2B2C, B2G, UNKNOWN }
    public enum Formacao { TECH, BUSINESS, DESIGN, HEALTH, EDUCATION, LAW, ENGINEERING, AGRO, STUDENT, OTHER }
    public enum Capacidade { ONE, FEW, MANY }
    public enum Formato { ONLINE, PRESENCIAL, AMBOS }
    public enum Frequencia { WEEKLY, BIWEEKLY, MONTHLY, FLEXIBLE }
    public enum Dia { MON, TUE, WED, THU, FRI, SAT, SUN }
    public enum Periodo { MORNING, AFTERNOON, EVENING }
}
