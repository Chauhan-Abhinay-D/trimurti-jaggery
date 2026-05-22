package com.trimurti.jaggery.controller;

import com.trimurti.jaggery.model.Inquiry;
import com.trimurti.jaggery.repository.InquiryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inquiries")
@CrossOrigin(origins = "*")
public class InquiryController {

    @Autowired
    private InquiryRepository inquiryRepository;

    @PostMapping
    public Inquiry createInquiry(@RequestBody Inquiry inquiry) {
        return inquiryRepository.save(inquiry);
    }

    @GetMapping("/admin")
    public List<Inquiry> getAllInquiries() {
        return inquiryRepository.findAll();
    }

    @PatchMapping("/{id}/status")
    public Inquiry updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Inquiry inquiry = inquiryRepository.findById(id).orElseThrow();
        inquiry.setStatus(payload.get("status"));
        return inquiryRepository.save(inquiry);
    }
}
