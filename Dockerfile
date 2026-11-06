# syntax=docker/dockerfile:1

# Build the Spring Boot module from the monorepo root so Maven can resolve its
# parent POM. Keeping this stage separate leaves Maven and source files out of
# the runtime image.
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /workspace

COPY pom.xml ./
COPY backend/pom.xml backend/pom.xml
COPY backend/checkstyle.xml backend/checkstyle.xml
RUN mvn --batch-mode --projects backend --also-make dependency:go-offline

COPY backend/src backend/src
RUN mvn --batch-mode --projects backend --also-make clean package -DskipTests

# A small JRE-only image runs the executable Spring Boot JAR as an unprivileged
# user. PORT is supplied by the host (8080 must be configured on Vercel).
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

RUN groupadd --system spring && useradd --system --gid spring spring
COPY --from=build --chown=spring:spring /workspace/backend/target/backend-*.jar /app/app.jar

USER spring
ENV SPRING_PROFILES_ACTIVE=prod
EXPOSE 8080

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=60.0", "-jar", "/app/app.jar"]
