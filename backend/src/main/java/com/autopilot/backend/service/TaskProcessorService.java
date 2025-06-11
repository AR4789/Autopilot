package com.autopilot.backend.service;

import java.io.IOException;
import java.sql.SQLException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.autopilot.backend.config.APIConfig;
import com.autopilot.backend.config.DBConfig;
import com.autopilot.backend.config.ServerConfig;
import com.autopilot.backend.loader.ConfigLoader;
import com.fasterxml.jackson.databind.JsonNode;

@Service
public class TaskProcessorService {

    private final SqlExecutor sqlExecutor;
    private final ShellExecutor shellExecutor;
    private final ApiExecutor apiExecutor;

    @Autowired
    public TaskProcessorService(SqlExecutor sqlExecutor,
            ShellExecutor shellExecutor,
            ApiExecutor apiExecutor) {
        this.sqlExecutor = sqlExecutor;
        this.shellExecutor = shellExecutor;
        this.apiExecutor = apiExecutor;
    }

    /**
     * Process tasks and return a combined output string with status messages.
     * 
     * @param configPath       Path to config.json
     * @param installationType "pre", "post", or "basic" etc.
     * @return Combined result message of all tasks.
     */
    public String processTasks(String configPath, String installationType)
            throws IOException, SQLException, InterruptedException {
        JsonNode rootNode = ConfigLoader.loadAllTasks(configPath);
        JsonNode tasks = rootNode.path(installationType);

        if (!tasks.isArray()) {
            return "No tasks found for section: " + installationType;
        }

        StringBuilder output = new StringBuilder();

        int taskCount = 0;

        for (JsonNode task : tasks) {
            taskCount++;
            String type = task.path("type").asText();
            output.append("Task #").append(taskCount).append(": type = ").append(type).append("\n");

            try {
                switch (type) {
                    case "db":
                        DBConfig dbConfig = ConfigLoader.convertToDBConfig(task.get("config"));
                        sqlExecutor.execute(dbConfig.getSqlFilepath(), dbConfig);
                        output.append("✅ SQL executed successfully for file: ").append(dbConfig.getSqlFilepath())
                                .append("\n");
                        break;

                    case "shell":
                        ServerConfig serverConfig = ConfigLoader.convertToServerConfig(task.get("config"));
                        String shellResult = shellExecutor.runShellFromConfig(serverConfig);
                        output.append(shellResult).append("\n");

                        break;
                    case "api":
                        APIConfig apiConfig = ConfigLoader.convertToAPIConfig(task.get("config"));
                        try {
                            APIConfig responseConfig = apiExecutor.execute(apiConfig);
                            int statusCode = responseConfig.getResponseCode();

                            if (statusCode == 200) {
                                output.append("✅ API executed successfully with response code: ").append(statusCode)
                                        .append("\n");
                            } else if (statusCode > 0) {
                                output.append("❌ API execution failed with response code: ").append(statusCode)
                                        .append("\n");
                            } else if (statusCode == -1) {
                                output.append("Incorrect URL").append("\n");
                                output.append("❌ API execution threw an exception: ")
                                        .append(responseConfig.getResponseMessage()).append("\n");
                            } else {
                                output.append("❌ API execution returned unknown status code: ").append(statusCode)
                                        .append("\n");
                            }
                        } catch (Exception e) {
                            output.append("❌ API execution threw an unexpected exception: ").append(e.getMessage())
                                    .append("\n");
                        }
                        break;

                    default:
                        output.append("⚠️ Unknown task type: ").append(type).append("\n");
                        break;
                }
            } catch (Exception e) {
                output.append("❌ Task failed: ").append(e.getMessage()).append("\n");
            }
            output.append("\n");
        }

        return output.toString();
    }
}
