package com.example.csit360;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class Csit360Application {

	public static void main(String[] args) {
		SpringApplication.run(Csit360Application.class, args);
	}

}
