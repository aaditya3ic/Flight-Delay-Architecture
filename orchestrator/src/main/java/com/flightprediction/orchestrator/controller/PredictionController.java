package com.flightprediction.orchestrator.controller;

import com.flightprediction.orchestrator.entity.PredictionLog;
import com.flightprediction.orchestrator.repository.PredictionLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

@RestController
@RequestMapping("/api/flights")
@CrossOrigin(origins = "http://localhost:3000")
public class PredictionController {

    /** Response returned by the ML service. */
    public static class MlPredictionResponse {
        private Double delayProbability;
        private String status;

        public Double getDelayProbability() {
            return delayProbability;
        }

        public void setDelayProbability(Double delayProbability) {
            this.delayProbability = delayProbability;
        }

        public String getStatus() {
            return status;
        }

        public void setStatus(String status) {
            this.status = status;
        }
    }

    @Autowired
    private PredictionLogRepository repository;

    private final RestClient restClient = RestClient.builder()
            .baseUrl("http://127.0.0.1:8000")
            .build();

    @PostMapping("/predict")
    public ResponseEntity<PredictionLog> predictFlightDelay(@RequestBody PredictionLog request) {
        
        try {
            // 1. Call the FastAPI ML Microservice
            MlPredictionResponse mlResponse = restClient.post()
                    .uri("/predict")
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .body(MlPredictionResponse.class);

            // 2. Attach ML results to the Entity
            if (mlResponse != null) {
                request.setDelayProbability(mlResponse.getDelayProbability());
                request.setStatus("Processed: " + mlResponse.getStatus());
            } else {
                request.setStatus("Failed: Empty ML response");
            }

        } catch (Exception e) {
            // Fallback if the Python server is offline or unreachable
            request.setStatus("Error connecting to ML Engine: " + e.getMessage());
        }

        // 3. Persist the record in PostgreSQL
        PredictionLog savedLog = repository.save(request);

        return ResponseEntity.ok(savedLog);
    }
}