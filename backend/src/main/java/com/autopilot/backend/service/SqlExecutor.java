package com.autopilot.backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.autopilot.backend.config.DBConfig;

import java.io.*;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;

import org.apache.ibatis.jdbc.ScriptRunner;

@Service
public class SqlExecutor {

    private static final Logger logger = LoggerFactory.getLogger(SqlExecutor.class);

    public String execute(String filePath, DBConfig config) throws IOException, SQLException {
        File sqlFile = new File(filePath);
        if (!sqlFile.exists() || sqlFile.isDirectory()) {
            String msg = "❌ SQL file not found at path: " + filePath;
            logger.error(msg);
            throw new IOException(msg);
        }

        String url = "jdbc:oracle:thin:@" + config.getDbUrl();

        try (Connection conn = DriverManager.getConnection(url, config.getDbUsername(), config.getDbPassword());
             Reader reader = new BufferedReader(new FileReader(sqlFile))) {

            ScriptRunner runner = new ScriptRunner(conn);

            PrintWriter logWriter = new PrintWriter(new Writer() {
                @Override
                public void write(char[] cbuf, int off, int len) {
                    logger.info(new String(cbuf, off, len));
                }

                @Override
                public void flush() {}
                @Override
                public void close() {}
            });

            runner.setLogWriter(logWriter);
            runner.setErrorLogWriter(logWriter);

            runner.runScript(reader);

            String success = "✅ SQL script executed successfully.";
            logger.info(success);
            return success;

        } catch (SQLException e) {
            String message;
            if (e.getErrorCode() == 1017) {
                message = "❌ Invalid DB credentials";
            } else if (e.getErrorCode() == 17002) {
                message = "❌ Database connection failed";
            } else {
                message = "❌ SQL execution failed with code " + e.getErrorCode() + ": " + e.getMessage();
            }

            logger.error("ERROR: {}", message);
            throw new SQLException(message, e);

        } catch (IOException e) {
            String msg = "❌ Failed to read SQL file: " + e.getMessage();
            logger.error("ERROR: {}", msg);
            throw new IOException(msg);
        }
    }
}
