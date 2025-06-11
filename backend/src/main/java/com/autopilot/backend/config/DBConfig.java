package com.autopilot.backend.config;

public class DBConfig {

    private String dbUrl;
    private String dbUsername;
    private String dbPassword;
    private String sqlFilepath;

    // Getters and Setters

    public String getDbUrl() {
        return dbUrl;
    }

    public void setDbUrl(String dbUrl) {
        this.dbUrl = dbUrl;
    }

    public String getDbUsername() {
        return dbUsername;
    }

    public void setDbUsername(String dbUsername) {
        this.dbUsername = dbUsername;
    }

    public String getDbPassword() {
        return dbPassword;
    }

    public void setDbPassword(String dbPassword) {
        this.dbPassword = dbPassword;
    }

    public String getSqlFilepath() {
        return sqlFilepath;
    }

    public void setSqlFilepath(String sqlFilepath) {
        this.sqlFilepath = sqlFilepath;
    }
}
