package com.autopilot.backend.service;

import com.autopilot.backend.config.ServerConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStreamReader;

@Service
public class ShellExecutor {

    private static final Logger logger = LoggerFactory.getLogger(ShellExecutor.class);

    public void uploadScriptToRemote(String localScriptPath, ServerConfig config) throws IOException, InterruptedException {
        logger.info("Uploading script to remote server...");
        System.out.println("localScriptPath: " + localScriptPath);
System.out.println("privateKeyPem: " + config.getPrivateKeyPemFilepath());
System.out.println("username: " + config.getServerUsername());
System.out.println("host: " + config.getServerIp());


        ProcessBuilder scpBuilder = new ProcessBuilder(
                "scp",
                "-i", config.getPrivateKeyPemFilepath(),
                "-o", "StrictHostKeyChecking=no",
                localScriptPath,
                config.getServerUsername() + "@" + config.getServerIp() + ":~/uploaded_script.sh"
        );

        scpBuilder.inheritIO();
        Process scpProcess = scpBuilder.start();
        int scpExit = scpProcess.waitFor();

        if (scpExit != 0) {
            throw new IOException("❌ SCP upload failed with exit code " + scpExit);
        }

        logger.info("✅ Script uploaded successfully.");
    }

    public String execute(String remoteScriptPath, ServerConfig config) throws IOException, InterruptedException {
        logger.info("Executing script on remote server...");
        System.out.println("File:_----"+ remoteScriptPath);
        System.out.println(config.getPrivateKeyPemFilepath());

        ProcessBuilder sshBuilder = new ProcessBuilder(
                "ssh",
                "-i", config.getPrivateKeyPemFilepath(),
                "-o", "StrictHostKeyChecking=no",
                config.getServerUsername() + "@" + config.getServerIp(),
                "sh " + remoteScriptPath
        );

        sshBuilder.inheritIO();
        Process sshProcess = sshBuilder.start();
        int sshExit = sshProcess.waitFor();

        if (sshExit != 0) {
            String err = "❌ Shell script execution failed with exit code: " + sshExit;
            logger.warn(err);
            throw new IOException(err);
        }

        String success = "✅ Shell script executed successfully.";
        logger.info(success);
        return success;
    }

    public String runShellFromConfig(ServerConfig config) throws IOException, InterruptedException {
    File localScript = new File(config.getShellScriptFilepath());
    File localPem = new File(config.getPrivateKeyPemFilepath());

    if (!localScript.exists()) {
        throw new IOException("❌ Script file not found: " + localScript.getAbsolutePath());
    }
    if (!localPem.exists() || localPem.length() == 0) {
        throw new IOException("❌ PEM file not found or empty: " + localPem.getAbsolutePath());
    }

    // Set permissions on PEM file
    Process chmod = Runtime.getRuntime().exec(new String[] { "chmod", "600", localPem.getAbsolutePath() });
    int exitCode = chmod.waitFor();
    if (exitCode != 0) {
        throw new IOException("❌ Failed to set permissions on PEM file");
    }

                // Remove passphrase from PEM using the provided password
            try {
                ProcessBuilder pb = new ProcessBuilder(
                        "ssh-keygen",
                        "-p",
                        "-P", config.getPemFilePassword(), // old passphrase
                        "-N", "", // new passphrase (none)
                        "-f", localPem.getAbsolutePath());
                pb.redirectErrorStream(true);
                Process process = pb.start();

                // Read output (optional but helpful for debugging)
                BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
                String line;
                StringBuilder output = new StringBuilder();
                while ((line = reader.readLine()) != null) {
                    output.append(line).append("\n");
                }

                int keygenExit = process.waitFor();
                if (keygenExit != 0) {
                    throw new IOException(
                            "❌ Failed to remove passphrase from PEM file using ssh-keygen.\nOutput:\n" + output);
                }
                System.out.println("✅ Passphrase removed from PEM successfully");

            } catch (Exception ex) {
                throw new IOException("❌ Exception while removing passphrase: " + ex.getMessage(), ex);
            }

    // Upload the script to remote
    uploadScriptToRemote(localScript.getAbsolutePath(), config);

    // Run the script remotely
    return execute("~/uploaded_script.sh", config);
}


}
