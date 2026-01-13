package com.rural.sports.services;

import com.rural.sports.models.Material;
import com.rural.sports.repositories.MaterialRepository; // Assuming a DAO/Repository exists
import com.rural.sports.models.User;
import com.rural.sports.repositories.UserRepository;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MaterialService {

    @Autowired
    private MaterialRepository materialRepository;

    @Autowired
    private UserRepository userRepository; // To get donor/holder info

    public List<Material> getAllMaterials() {
        return materialRepository.findAll();
    }

    public Material createDonation(Map<String, Object> payload) {
        String name = (String) payload.get("name");
        String type = (String) payload.get("type");
        Integer conditionLevel = (Integer) payload.get("conditionLevel");
        Long donorId = ((Number) payload.get("donorId")).longValue();

        User donor = userRepository.findById(donorId).orElse(null);

        Material material = new Material();
        material.setName(name);
        material.setType(type);
        material.setConditionLevel(conditionLevel);
        material.setDonor(donor);
        material.setStatus("PENDING"); // Default status on donation

        return materialRepository.save(material);
    }

    public boolean borrowMaterial(Long materialId, Long userId) {
        Material material = materialRepository.findById(materialId).orElse(null);
        User user = userRepository.findById(userId).orElse(null);

        if (material != null && user != null && "IN_STOCK".equals(material.getStatus())) {
            material.setStatus("BORROWED");
            material.setCurrentHolder(user);
            materialRepository.save(material);
            return true;
        }
        return false;
    }

    public boolean returnMaterial(Long materialId) {
        Material material = materialRepository.findById(materialId).orElse(null);
        if (material != null && "BORROWED".equals(material.getStatus())) {
            material.setStatus("IN_STOCK");
            material.setCurrentHolder(null);
            materialRepository.save(material);
            return true;
        }
        return false;
    }

    public boolean updateMaterialStatus(Long id, String status) {
        Material material = materialRepository.findById(id).orElse(null);
        if (material != null) {
            material.setStatus(status);
            materialRepository.save(material);
            return true;
        }
        return false;
    }

    public boolean deleteMaterial(Long id) {
        if (materialRepository.existsById(id)) {
            materialRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
