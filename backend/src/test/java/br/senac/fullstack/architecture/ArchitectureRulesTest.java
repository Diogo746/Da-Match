package br.senac.fullstack.architecture;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.RestController;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.library.Architectures.layeredArchitecture;

@AnalyzeClasses(packages = "br.senac.fullstack", importOptions = ImportOption.DoNotIncludeTests.class)
public class ArchitectureRulesTest {

    @ArchTest
    static final ArchRule controllerClassesShouldBeAnnotatedWithRestController =
            classes().that().resideInAPackage("..controller..")
                    .should().beAnnotatedWith(RestController.class);

    @ArchTest
    static final ArchRule serviceClassesShouldBeAnnotatedWithService =
            classes().that().resideInAPackage("..service..")
                    .should().beAnnotatedWith(Service.class);

    @ArchTest
    static final ArchRule layeredArchitectureRule = layeredArchitecture()
            .consideringOnlyDependenciesInLayers()
            .layer("Controller").definedBy("..controller..")
            .layer("Service").definedBy("..service..")
            .whereLayer("Controller").mayNotBeAccessedByAnyLayer()
            .whereLayer("Service").mayOnlyBeAccessedByLayers("Controller");
}
