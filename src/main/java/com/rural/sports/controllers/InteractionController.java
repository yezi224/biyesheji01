package com.rural.sports.controllers;

import com.rural.sports.models.Interaction;
import com.rural.sports.models.InteractionType;
import com.rural.sports.services.InteractionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/interactions")
public class InteractionController {

    @Autowired
    private InteractionService interactionService;

    @GetMapping
    public List<Interaction> getInteractions(@RequestParam List<InteractionType> types) {
        return interactionService.getInteractions(types);
    }

    @PostMapping
    public Interaction addInteraction(@RequestBody Interaction interaction) {
        return interactionService.addInteraction(interaction);
    }

    @PutMapping("/{id}")
    public Interaction updateInteraction(@PathVariable Long id, @RequestBody Interaction interaction) {
        return interactionService.updateInteraction(id, interaction);
    }

    @PostMapping("/{id}/reply")
    public Interaction replyInteraction(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        return interactionService.replyInteraction(id, payload.get("replyText"));
    }

    @DeleteMapping("/{id}")
    public void deleteInteraction(@PathVariable Long id) {
        interactionService.deleteInteraction(id);
    }
}
