package com.trimurti.jaggery.dto;

public class AuthResponse {
    private String token;
    private String name;
    private String role;
    private String phone;
    private String address;
    private Long id;

    public AuthResponse(String token, String name, String role, String phone, String address, Long id) {
        this.token = token;
        this.name = name;
        this.role = role;
        this.phone = phone;
        this.address = address;
        this.id = id;
    }

    public String getToken() { return token; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String getPhone() { return phone; }
    public String getAddress() { return address; }
    public Long getId() { return id; }
}
