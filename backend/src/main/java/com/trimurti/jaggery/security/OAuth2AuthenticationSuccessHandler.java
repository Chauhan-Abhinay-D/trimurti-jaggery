package com.trimurti.jaggery.security;

import com.trimurti.jaggery.model.User;
import com.trimurti.jaggery.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException, ServletException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        String serverName = request.getServerName();
        String frontendUrl = "https://trimurti-jaggery-udgir.vercel.app/login";
        if (serverName.contains("localhost") || serverName.contains("127.0.0.1")) {
            frontendUrl = "http://localhost:5173/login";
        }

        if (email == null) {
            response.sendRedirect(UriComponentsBuilder.fromUriString(frontendUrl)
                    .queryParam("error", "Email not found from Google provider")
                    .build().toUriString());
            return;
        }

        String sessionId = java.util.UUID.randomUUID().toString();

        User user = userRepository.findByEmail(email).map(existingUser -> {
            existingUser.setActiveSessionId(sessionId);
            return userRepository.save(existingUser);
        }).orElseGet(() -> {
            User newUser = new User();
            newUser.setName(name != null ? name : "Google User");
            newUser.setEmail(email);
            newUser.setRole("ROLE_USER");
            newUser.setActiveSessionId(sessionId);
            return userRepository.save(newUser);
        });

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole(), sessionId);

        String targetUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                .queryParam("token", token)
                .queryParam("name", URLEncoder.encode(user.getName(), StandardCharsets.UTF_8))
                .queryParam("email", URLEncoder.encode(user.getEmail(), StandardCharsets.UTF_8))
                .queryParam("role", user.getRole())
                .queryParam("phone", user.getPhone() != null ? URLEncoder.encode(user.getPhone(), StandardCharsets.UTF_8) : "")
                .queryParam("address", user.getAddress() != null ? URLEncoder.encode(user.getAddress(), StandardCharsets.UTF_8) : "")
                .queryParam("id", user.getId())
                .build().toUriString();

        clearAuthenticationAttributes(request);
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
