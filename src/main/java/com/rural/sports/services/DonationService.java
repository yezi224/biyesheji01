package com.rural.sports.services;

import com.rural.sports.models.Donation;
import com.rural.sports.repositories.DonationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DonationService {

    @Autowired
    private DonationRepository donationRepository;

    public List<Donation> getAllDonations() {
        return donationRepository.findAll();
    }

    public Donation getDonationById(Long id) {
        return donationRepository.findById(id).orElse(null);
    }

    public Donation createDonation(Donation donation) {
        return donationRepository.save(donation);
    }

    public Donation updateDonation(Long id, Donation donation) {
        if (donationRepository.existsById(id)) {
            donation.setId(id);
            return donationRepository.save(donation);
        }
        return null;
    }

    public void deleteDonation(Long id) {
        donationRepository.deleteById(id);
    }
}
