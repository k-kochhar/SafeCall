import os
import logging
from fastapi import FastAPI
from dotenv import load_dotenv
import uvicorn
# from call import router as call_router

load_dotenv() 

app = FastAPI()
logging.basicConfig(level=logging.INFO)

# Include the call router under the "/call" prefix.
# app.include_router(call_router, prefix="/call")

@app.get("/")
async def home():
    return {"message": "FastAPI server is running!"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5050))
    uvicorn.run(app, host="0.0.0.0", port=port)
