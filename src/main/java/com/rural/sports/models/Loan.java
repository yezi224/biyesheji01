package com.rural.sports.models;

import lombok.Data;
import javax.persistence.*;
import java.util.Date;

@Data
@Entity
@Table(name = "loans")
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String materialType;
    private Date returnTime;
    private String status; // BORROWED, RETURNED

    @ManyToOne
    @JoinColumn(name = "borrower_id")
    private User borrower;
}
