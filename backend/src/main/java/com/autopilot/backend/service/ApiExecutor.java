package com.autopilot.backend.service;

import com.autopilot.backend.config.APIConfig;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class ApiExecutor {

    private static final Logger logger = LoggerFactory.getLogger(ApiExecutor.class);
    private static final ObjectMapper objectMapper = new ObjectMapper();

   public APIConfig execute(APIConfig apiConfig) {
    HttpURLConnection connection = null;
    try {
        URL url = new URL(apiConfig.getUrl());
        connection = (HttpURLConnection) url.openConnection();
        connection.setRequestMethod(apiConfig.getMethod());

        if (apiConfig.getHeaders() != null) {
            for (Map.Entry<String, String> header : apiConfig.getHeaders().entrySet()) {
                connection.setRequestProperty(header.getKey(), header.getValue());
            }
        }

        if ("POST".equalsIgnoreCase(apiConfig.getMethod())) {
            connection.setDoOutput(true);
            try (OutputStream os = connection.getOutputStream()) {
                byte[] input;
                Object body = apiConfig.getBody();
                if (body instanceof String) {
                    input = ((String) body).getBytes(StandardCharsets.UTF_8);
                } else {
                    String jsonBody = objectMapper.writeValueAsString(body);
                    input = jsonBody.getBytes(StandardCharsets.UTF_8);
                }
                os.write(input, 0, input.length);
            }
        }

        int status = connection.getResponseCode();
        logger.info("API Response Code: {}", status);

        String responseMessage = readResponse(connection);
        apiConfig.setResponseCode(status);
        apiConfig.setResponseMessage(responseMessage);

        if (status >= 400) {
            logger.error("API call failed with status code: {} and message: {}", status, responseMessage);
        } else {
            logger.info("API executed successfully.");
        }

        return apiConfig;

    } catch (Exception e) {
        // Catch any exception (including IOException) here
        logger.error("Exception during API execution: ", e);

        // Set response code to -1 to indicate exception and set message
        apiConfig.setResponseCode(-1);
        apiConfig.setResponseMessage(e.getMessage());

        return apiConfig;

    } finally {
        if (connection != null) {
            connection.disconnect();
        }
    }
}


    private String readResponse(HttpURLConnection connection) throws IOException {
        StringBuilder response = new StringBuilder();
        try (BufferedReader in = new BufferedReader(new InputStreamReader(connection.getInputStream()))) {
            String inputLine;
            while ((inputLine = in.readLine()) != null) {
                response.append(inputLine);
            }
        } catch (IOException e) {
            // Handle the case where the error response is returned
            try (BufferedReader in = new BufferedReader(new InputStreamReader(connection.getErrorStream()))) {
                String inputLine;
                while ((inputLine = in.readLine()) != null) {
                    response.append(inputLine);
                }
            }
        }
        return response.toString();
    }
}
