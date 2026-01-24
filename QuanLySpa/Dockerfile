# 1. Image Java
FROM eclipse-temurin:21-jdk

# 2. Thư mục làm việc
WORKDIR /app

# 3. Copy jar build từ Gradle
COPY build/libs/*.jar app.jar

# 4. Expose port
EXPOSE 8080

# 5. Run app
ENTRYPOINT ["java","-jar","app.jar"]
