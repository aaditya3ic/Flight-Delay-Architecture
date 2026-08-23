package com.flightprediction.orchestrator.controller;

import com.flightprediction.orchestrator.entity.PredictionLog;
import com.flightprediction.orchestrator.repository.PredictionLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/flights")
@CrossOrigin(origins = "http://localhost:3000") // This explicitly allows your future React app to connect
public class PredictionController {

    @Autowired
    private PredictionLogRepository repository;

    @PostMapping("/predict")
    public ResponseEntity<PredictionLog> predictFlightDelay(@RequestBody PredictionLog request) {
        
        // 1. Mark the initial status
        request.setStatus("Pending ML Engine");
        
        // 2. Save the incoming request to the PostgreSQL database
        PredictionLog savedLog = repository.save(request);
        
        // (Next Phase: We will add the HTTP client here to forward data to Python)
        
        // 3. Return the saved record with its new Database ID
        return ResponseEntity.ok(savedLog);
    }
}