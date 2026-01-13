package com.rural.sports.daos;

import com.rural.sports.models.Interaction;
import com.rural.sports.models.InteractionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InteractionRepository extends JpaRepository<Interaction, Long> {
    List<Interaction> findByTypeIn(List<InteractionType> types);
}
