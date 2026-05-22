package com.trimurti.jaggery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import com.trimurti.jaggery.model.User;
import com.trimurti.jaggery.repository.UserRepository;

@SpringBootApplication
public class JaggeryApplication {

	public static void main(String[] args) {
		SpringApplication.run(JaggeryApplication.class, args);
	}

    @Bean
    public CommandLineRunner initAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (!userRepository.existsByEmail("admin@gmail.com")) {
                User admin = new User();
                admin.setName("Super Admin");
                admin.setEmail("admin@gmail.com");
                admin.setPassword(passwordEncoder.encode("@123Pass"));
                admin.setRole("ROLE_ADMIN");
                userRepository.save(admin);
            }
        };
    }
}
