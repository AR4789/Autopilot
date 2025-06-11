package com.autopilot.backend.config;

public class ServerConfig {

    private String serverIp;
    private String serverUsername;
    private String shellScriptFilepath;
    private String privateKeyPemFilepath;
    private String PemFilePassword;


   


    // Getters and Setters
    public String getServerIp() {
        return serverIp;
    }

    public void setServerIp(String serverIp) {
        this.serverIp = serverIp;
    }

    public String getServerUsername() {
        return serverUsername;
    }

    public void setServerUsername(String serverUsername) {
        this.serverUsername = serverUsername;
    }

    public String getShellScriptFilepath() {
        return shellScriptFilepath;
    }

    public void setShellScriptFilepath(String shellScriptFilepath) {
        this.shellScriptFilepath = shellScriptFilepath;
    }

    public String getPrivateKeyPemFilepath() {
        return privateKeyPemFilepath;
    }

    public void setPrivateKeyPemFilepath(String privateKeyPemFilepath) {
        this.privateKeyPemFilepath = privateKeyPemFilepath;
    }

    public String getPemFilePassword() {
        return PemFilePassword;
    }

    public void setPemFilePassword(String pemFilePassword) {
        PemFilePassword = pemFilePassword;
    }
}
