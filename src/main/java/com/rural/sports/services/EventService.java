package com.rural.sports.services;

import com.rural.sports.models.Event;
import com.rural.sports.models.User;
import com.rural.sports.repositories.EventRepository;
import com.rural.sports.repositories.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class EventService {

    @Autowired
    private EventRepository eventRepository;
    
    @Autowired
    private UserRepository userRepository;

    public List<Event> getAllEvents() {
        return eventRepository.findAll();
    }

    public Event getEventById(Long id) {
        return eventRepository.findById(id).orElse(null);
    }

    public Event createEvent(Event event) {
        return eventRepository.save(event);
    }

    public Event updateEvent(Long id, Event event) {
        if (eventRepository.existsById(id)) {
            event.setId(id);
            return eventRepository.save(event);
        }
        return null;
    }

    public void deleteEvent(Long id) {
        eventRepository.deleteById(id);
    }

    public boolean registerForEvent(Long eventId, Long userId, String healthCondition) {
        Event event = eventRepository.findById(eventId).orElse(null);
        User user = userRepository.findById(userId).orElse(null);

        if (event != null && user != null) {
            // Here you would typically add the user to the event's participants list.
            // This depends on how the relationship is modeled in your Event and User entities.
            // For example, if Event has a List<User> participants:
            // event.getParticipants().add(user);
            // eventRepository.save(event);
            // For now, we'll just return true to confirm the logic is wired up.
            return true;
        }
        return false;
    }

    public List<Event> getRecommendedEvents(Long userId) {
        // Mock implementation: returns a subset of events.
        // A real implementation would have logic to determine recommendations.
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return List.of(); // Or throw an exception
        }

        // For now, let's just return up to 5 events as a mock recommendation.
        return eventRepository.findAll().stream().limit(5).collect(Collectors.toList());
    }
}
