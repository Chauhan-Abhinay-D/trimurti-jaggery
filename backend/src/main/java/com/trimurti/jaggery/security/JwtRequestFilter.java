package com.trimurti.jaggery.security;

import com.trimurti.jaggery.model.User;
import com.trimurti.jaggery.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Optional;

@Component
public class JwtRequestFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserRepository userRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;
        String tokenSessionId = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                username = jwtUtil.extractEmail(jwt);
                tokenSessionId = jwtUtil.extractSessionId(jwt);
            } catch (Exception e) {
                // Token parsing failed (expired, malformed, invalid signature, etc.)
                logger.warn("JWT parsing failed: " + e.getMessage());
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            Optional<User> optionalUser = userRepository.findByEmail(username);

            if (optionalUser.isPresent()) {
                User user = optionalUser.get();

                // Validate token expiration, email matching, and concurrent activeSessionId
                if (jwtUtil.validateToken(jwt, user.getEmail())) {
                    String activeDbSessionId = user.getActiveSessionId();
                    
                    if (activeDbSessionId != null && activeDbSessionId.equals(tokenSessionId)) {
                        // User role mapping (ensure role begins with ROLE_ prefix for Spring Security)
                        String role = user.getRole();
                        if (role != null && !role.startsWith("ROLE_")) {
                            role = "ROLE_" + role;
                        }
                        
                        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(role != null ? role : "ROLE_USER");
                        UsernamePasswordAuthenticationToken usernamePasswordAuthenticationToken = 
                                new UsernamePasswordAuthenticationToken(user, null, Collections.singletonList(authority));
                        
                        usernamePasswordAuthenticationToken.setDetails(
                                new WebAuthenticationDetailsSource().buildDetails(request)
                        );
                        
                        SecurityContextHolder.getContext().setAuthentication(usernamePasswordAuthenticationToken);
                    } else {
                        logger.warn("Token session ID mismatch or null. Token: " + tokenSessionId + ", DB: " + activeDbSessionId);
                    }
                }
            }
        }
        chain.doFilter(request, response);
    }
}
