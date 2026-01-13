package com.rural.sports.services;

import com.rural.sports.models.Interaction;
import com.rural.sports.models.InteractionType;
import com.rural.sports.daos.InteractionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InteractionService {

    @Autowired
    private InteractionRepository interactionRepository;

    public List<Interaction> getInteractions(List<InteractionType> types) {
        return interactionRepository.findByTypeIn(types);
    }

    public Interaction addInteraction(Interaction interaction) {
        return interactionRepository.save(interaction);
    }

    public Interaction updateInteraction(Long id, Interaction interactionDetails) {
        Interaction interaction = interactionRepository.findById(id).orElse(null);
        if (interaction != null) {
            interaction.setTitle(interactionDetails.getTitle());
            interaction.setContent(interactionDetails.getContent());
            return interactionRepository.save(interaction);
        }
        return null;
    }

    public Interaction replyInteraction(Long id, String replyContent) {
        Interaction interaction = interactionRepository.findById(id).orElse(null);
        if (interaction != null) {
            interaction.setReplyContent(replyContent);
            return interactionRepository.save(interaction);
        }
        return null;
    }

    public void deleteInteraction(Long id) {
        interactionRepository.deleteById(id);
    }
}
