package com.rural.sports.controllers;

import com.rural.sports.models.Event;
import com.rural.sports.services.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {

    @Autowired
    private EventService eventService;

    @GetMapping
    public List<Event> getAllEvents() {
        return eventService.getAllEvents();
    }

    @GetMapping("/{id}")
    public Event getEventById(@PathVariable Long id) {
        return eventService.getEventById(id);
    }

    /**
     * GET /api/events/recommended -> Corresponds to ApiService.getRecommendedEvents
     */
    @GetMapping("/recommended")
    public List<Event> getRecommendedEvents(@RequestParam Long userId) {
        return eventService.getRecommendedEvents(userId);
    }

    @PostMapping
    public Event createEvent(@RequestBody Event event) {
        return eventService.createEvent(event);
    }

    @PutMapping("/{id}")
    public Event updateEvent(@PathVariable Long id, @RequestBody Event event) {
        return eventService.updateEvent(id, event);
    }

    @DeleteMapping("/{id}")
    public void deleteEvent(@PathVariable Long id) {
        eventService.deleteEvent(id);
    }

    /**
     * POST /api/events/{eventId}/register -> Corresponds to ApiService.registerEvent
     * The frontend sends { userId, healthCondition }
     */
    @PostMapping("/{eventId}/register")
    public ResponseEntity<Map<String, Boolean>> registerForEvent(@PathVariable Long eventId, @RequestBody Map<String, Object> payload) {
        Long userId = ((Number) payload.get("userId")).longValue();
        String healthCondition = (String) payload.get("healthCondition");
        boolean success = eventService.registerForEvent(eventId, userId, healthCondition);
        return ResponseEntity.ok(Map.of("success", success));
    }
}
