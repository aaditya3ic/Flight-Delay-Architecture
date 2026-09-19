from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="Flight Delay ML Engine")

# Define the exact data structure expected from Spring Boot
class FlightData(BaseModel):
    sourceAirport: str
    destinationAirport: str
    airline: str
    weatherCondition: str

@app.post("/predict")
def predict_delay(data: FlightData):
    # TODO: Load your .pkl model here
    # For now, we return a mocked probability to verify the connection
    
    mock_probability = 0.85 
    
    return {
        "status": "Success",
        "delayProbability": mock_probability
    }