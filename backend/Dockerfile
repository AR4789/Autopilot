# Use a base image with JDK
FROM eclipse-temurin:17-jdk-alpine

# Set working directory
WORKDIR /app

# Copy the built JAR file into the image (adjust the name accordingly)
COPY target/*.jar app.jar

# Expose port (must match your Spring Boot server port)
EXPOSE 8080

# Run the JAR file
ENTRYPOINT ["java", "-jar", "app.jar"]
