package br.senac.fullstack.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import jakarta.persistence.Entity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

@AnalyzeClasses(packages = "br.senac.fullstack", importOptions = ImportOption.DoNotIncludeTests.class)
public class ArchitectureRulesTest {

    @ArchTest
    static final ArchRule controllerClassesShouldBeAnnotatedWithRestController =
            classes().that().resideInAPackage("..api.controller..")
                    .should().beAnnotatedWith(RestController.class);

    @ArchTest
    static final ArchRule serviceClassesShouldBeAnnotatedWithService =
            classes().that().resideInAPackage("..application.service..")
                    .should().beAnnotatedWith(Service.class);

    @ArchTest
    static final ArchRule entityClassesShouldBeAnnotatedWithEntity =
            classes().that().resideInAPackage("..domain.entity..")
                    .should().beAnnotatedWith(Entity.class);

    @ArchTest
    static final ArchRule repositoryInterfacesShouldExtendJpaRepository =
            classes().that().resideInAPackage("..infrastructure.persistence.repository..")
                    .should().beAssignableTo(JpaRepository.class);

    @ArchTest
    static final ArchRule layeredArchitectureRule = layeredArchitecture()
            .consideringOnlyDependenciesInLayers()
            .layer("Controller").definedBy("..api.controller..")
            .layer("DTO").definedBy("..api.dto..")
            .layer("Service").definedBy("..application.service..")
            .layer("Entity").definedBy("..domain.entity..")
            .layer("Repository").definedBy("..infrastructure.persistence.repository..")
            .whereLayer("Controller").mayNotBeAccessedByAnyLayer()
            .whereLayer("DTO").mayOnlyBeAccessedByLayers("Controller", "Service")
            .whereLayer("Service").mayOnlyBeAccessedByLayers("Controller")
            .whereLayer("Entity").mayOnlyBeAccessedByLayers("Service", "Repository")
            .whereLayer("Repository").mayOnlyBeAccessedByLayers("Service");
}
