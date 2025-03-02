import os
import logging
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from dotenv import load_dotenv
import uvicorn
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from bson import ObjectId
# from call import router as call_router

# Import models from models.py
from models import UserBase, UserCreate, UserResponse, EmergencyContact

load_dotenv()

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI, server_api=ServerApi('1'))

# Update to use the Testing database and Users collection
db = client.Testing
users_collection = db.Users

# Test MongoDB Connection
try:
    client.admin.command('ping')
    print("Successfully connected to MongoDB!")
except Exception as e:
    print(f"MongoDB Connection Error: {e}")

app = FastAPI(title="SafeCall API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include the call router under the "/call" prefix.
# app.include_router(call_router, prefix="/call")

@app.get("/")
async def home():
    return {"message": "SafeCall API is running!"}


# New route to get all users from the Testing.Users collection
@app.get("/all-users/")
async def get_all_users():
    """Retrieve all users from the Testing.Users collection"""
    try:
        # Convert MongoDB cursor to list and convert ObjectId to string
        users = list(users_collection.find())
        for user in users:
            user["_id"] = str(user["_id"])
        return {"users": users}
    except Exception as e:
        logging.error(f"Error fetching all users: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 3001))
    uvicorn.run(app, port=port)
