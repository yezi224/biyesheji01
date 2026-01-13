package com.rural.sports.controllers;

import com.rural.sports.models.Material;
import com.rural.sports.services.MaterialService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// This new controller consolidates logic for materials, matching the frontend's API calls.
@RestController
@RequestMapping("/api/materials")
public class MaterialController {

    @Autowired
    private MaterialService materialService; // This service will be created in a next step

    /**
     * GET /api/materials -> Corresponds to ApiService.getMaterials
     */
    @GetMapping
    public List<Material> getAllMaterials() {
        return materialService.getAllMaterials();
    }
    
    /**
     * POST /api/materials/donate -> Corresponds to ApiService.donateMaterial
     * The frontend sends { name, type, conditionLevel, donorId }
     */
    @PostMapping("/donate")
    public Material donateMaterial(@RequestBody Map<String, Object> payload) {
        return materialService.createDonation(payload);
    }

    /**
     * POST /api/materials/{materialId}/borrow -> Corresponds to ApiService.borrowMaterial
     * The frontend sends { userId, duration }
     */
    @PostMapping("/{materialId}/borrow")
    public ResponseEntity<Map<String, Boolean>> borrowMaterial(@PathVariable Long materialId, @RequestBody Map<String, Object> payload) {
        Long userId = ((Number) payload.get("userId")).longValue();
        // duration is sent but not used in the old Loan model. We can add it later.
        boolean success = materialService.borrowMaterial(materialId, userId);
        return ResponseEntity.ok(Map.of("success", success));
    }

    /**
     * POST /api/materials/{materialId}/return -> Corresponds to ApiService.returnMaterial
     */
    @PostMapping("/{materialId}/return")
    public ResponseEntity<Map<String, Boolean>> returnMaterial(@PathVariable Long materialId) {
        boolean success = materialService.returnMaterial(materialId);
        return ResponseEntity.ok(Map.of("success", success));
    }

    /**
     * PUT /api/materials/{id}/status -> Corresponds to ApiService.updateMaterialStatus
     * The frontend sends { status }
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Boolean>> updateMaterialStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        String status = payload.get("status");
        boolean success = materialService.updateMaterialStatus(id, status);
        return ResponseEntity.ok(Map.of("success", success));
    }

    /**
     * DELETE /api/materials/{id} -> Corresponds to ApiService.deleteMaterial
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Boolean>> deleteMaterial(@PathVariable Long id) {
        boolean success = materialService.deleteMaterial(id);
        return ResponseEntity.ok(Map.of("success", success));
    }
}
