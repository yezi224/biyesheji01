package com.rural.sports.models;

import lombok.Data;
import javax.persistence.*;

@Data
@Entity
@Table(name = "materials")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String type;
    private Integer conditionLevel;
    private String status; // PENDING, IN_STOCK, BORROWED

    @ManyToOne
    @JoinColumn(name = "donor_id")
    private User donor;

    @ManyToOne
    @JoinColumn(name = "current_holder_id")
    private User currentHolder;
}
