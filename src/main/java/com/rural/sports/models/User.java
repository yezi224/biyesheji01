package com.rural.sports.models;

import lombok.Data;
import javax.persistence.*;

@Data
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String username;
    private String password;
    private String role; // VILLAGER, ORGANIZER, ADMIN
    private String village;
    private String sportPreference;
    private String contactInfo;
    private String organizationCertificate; 
    private String responsibleArea;
}
