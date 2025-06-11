package com.autopilot.backend;

import org.springframework.data.jpa.repository.config.EnableJpaRepositories;


import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableJpaRepositories
public class InstallerFrameworkApplication {


    public static void main(String[] args) {
        SpringApplication.run(InstallerFrameworkApplication.class, args);
    }

}

