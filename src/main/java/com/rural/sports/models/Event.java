package com.rural.sports.models;

import lombok.Data;
import javax.persistence.*;
import java.util.Date;

@Data
@Entity
@Table(name = "events")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;
    private String rules;
    private Date startTime;
    private Date endTime;
    private String location;
    private String status; // UPCOMING, ONGOING, FINISHED
    private String theme;

    @ManyToOne
    @JoinColumn(name = "organizer_id")
    private User organizer;
}
