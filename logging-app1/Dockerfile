FROM maven:3-eclipse-temurin-18-alpine as builder
WORKDIR application

COPY pom.xml .
COPY src src

RUN mvn install -DskipTests
RUN java -Djarmode=layertools -jar target/*.jar extract

FROM eclipse-temurin:18-jre-alpine
WORKDIR application

COPY --from=builder ["application/dependencies/", "application/spring-boot-loader/", "application/snapshot-dependencies/", "application/application/", "./"]

ENTRYPOINT ["java", "org.springframework.boot.loader.JarLauncher"]
