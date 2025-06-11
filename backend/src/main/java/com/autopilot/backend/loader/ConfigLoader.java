package com.autopilot.backend.loader;

import com.autopilot.backend.config.APIConfig;
import com.autopilot.backend.config.DBConfig;
import com.autopilot.backend.config.ServerConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.File; // ✅ Needed
import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

public class ConfigLoader {

    private static final ObjectMapper mapper = new ObjectMapper();

    public static List<DBConfig> loadDBConfigs(String configPath) throws IOException {
        System.out.println("Loading DB configs");
        JsonNode rootNode = mapper.readTree(new File(configPath));
        List<DBConfig> dbConfigs = new ArrayList<>();

        for (JsonNode task : rootNode.get("tasks")) {
            if ("db".equalsIgnoreCase(task.get("type").asText())) {
                DBConfig dbConfig = mapper.treeToValue(task.get("config"), DBConfig.class);
                dbConfigs.add(dbConfig);
            }
        }
        return dbConfigs;
    }

    public static List<ServerConfig> loadServerConfigs(String configPath) throws IOException {
        System.out.println("Loading Shell configs");
        JsonNode rootNode = mapper.readTree(new File(configPath));
        List<ServerConfig> serverConfigs = new ArrayList<>();

        for (JsonNode task : rootNode.get("tasks")) {
            if ("shell".equalsIgnoreCase(task.get("type").asText())) {
                ServerConfig serverConfig = mapper.treeToValue(task.get("config"), ServerConfig.class);
                serverConfigs.add(serverConfig);
            }
        }
        return serverConfigs;
    }

    public static List<APIConfig> loadAPIConfigs(String configPath) throws IOException {
        System.out.println("Loading API configs");
        JsonNode rootNode = mapper.readTree(new File(configPath));
        List<APIConfig> apiConfigs = new ArrayList<>();

        for (JsonNode task : rootNode.get("tasks")) {
            if ("api".equalsIgnoreCase(task.get("type").asText())) {
                APIConfig apiConfig = mapper.treeToValue(task.get("config"), APIConfig.class);
                apiConfigs.add(apiConfig);
            }
        }
        return apiConfigs;
    }

    // Convert single config nodes
    public static DBConfig convertToDBConfig(JsonNode configNode) throws IOException {
        return mapper.treeToValue(configNode, DBConfig.class);
    }

    public static ServerConfig convertToServerConfig(JsonNode configNode) throws IOException {
        return mapper.treeToValue(configNode, ServerConfig.class);
    }

    public static APIConfig convertToAPIConfig(JsonNode configNode) throws IOException {
        return mapper.treeToValue(configNode, APIConfig.class);
    }

    // Optional if using outside the task array pattern
    public static Object loadConfigBasedOnType(String configPath) throws IOException {
        JsonNode rootNode = mapper.readTree(new File(configPath));
        String type = rootNode.path("type").asText();

        switch (type) {
            case "database":
                return loadDBConfigs(configPath);
            case "shell":
                return loadServerConfigs(configPath);
            case "api":
                return loadAPIConfigs(configPath);
            default:
                throw new IllegalArgumentException("Unknown config type: " + type);
        }
    }

    public static JsonNode loadAllTasks(String configPath) throws IOException {
        System.out.println("Loading all tasks");
        return mapper.readTree(new File(configPath));
    }
}
