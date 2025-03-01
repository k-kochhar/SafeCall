from flask import Flask, request, jsonify
from flask_sockets import Sockets
from twilio.rest import Client
import openai
import os
import json
import requests
import asyncio
import websockets
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__)
sockets = Sockets(app)

@app.route("/")
def home():
    return "Flask server is running!"


# Twilio credentials (stored securely)
TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.environ.get("TWILIO_PHONE_NUMBER")
twilio_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# OpenAI API Key
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# WebSocket URL for OpenAI Realtime API
OPENAI_REALTIME_URL = "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17"
HEADERS = [
    "Authorization: Bearer " + OPENAI_API_KEY,
    "OpenAI-Beta: realtime=v1"
]

# Vercel Backend API for Storing User Data
VERCEL_API_URL = os.environ.get("VERCEL_API_URL")

# Emergency trigger words
EMERGENCY_WORDS = ["pineapple", "red alert", "danger", "help me"]

def get_caller_persona(persona):
    """Define different caller personalities."""
    personas = {
        "boss": "You are the user's boss, speaking urgently and formally about an important work issue.",
        "parent": "You are the user's parent, checking in with concern and authority.",
        "friend": "You are the user's friend, casual and engaging, helping them get out of social situations.",
        "police": "You are a police officer, serious and professional, ensuring the user's safety.",
        "partner": "You are the user's romantic partner, affectionate but firm in making excuses."
    }
    return personas.get(persona, "You are a realistic AI caller.")

@app.route("/schedule_call", methods=["POST"])
def schedule_call():
    """Schedule a fake call by storing data in Vercel."""
    data = request.json
    response = requests.post(f"{VERCEL_API_URL}/store_call", json=data)
    return jsonify({"message": "Call scheduled successfully!"}) if response.status_code == 200 else jsonify({"error": "Failed to store call data in Vercel"}), 500

@app.route("/get_user/<user_id>", methods=["GET"])
def get_user(user_id):
    """Retrieve stored user information."""
    user = stored_users.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user), 200

# In-memory storage for testing
stored_users = {}

@app.route("/store_user", methods=["POST"])
def store_user():
    """Store user data for calls."""
    data = request.json
    if not data:
        return jsonify({"error": "Invalid JSON"}), 400
    
    user_id = data.get("user_id")
    name = data.get("name")
    phone_number = data.get("phone_number")
    emergency_contacts = data.get("emergency_contacts", [])

    if not user_id or not phone_number or not emergency_contacts:
        return jsonify({"error": "Missing required fields"}), 400

    # Store data in memory (temporary storage)
    stored_users[user_id] = {
        "name": name,
        "phone_number": phone_number,
        "emergency_contacts": emergency_contacts
    }

    return jsonify({"message": "User added successfully!"}), 201


@app.route("/trigger_call", methods=["POST"])
def trigger_call():
    """Trigger a real-time AI phone call using Twilio."""
    data = request.json
    user_id = data.get("user_id")

    # Fetch user from local in-memory storage instead of Vercel
    user_data = stored_users.get(user_id)

    if not user_data:
        return jsonify({"error": "User settings not found"}), 404

    persona = "friend"  # Default persona (you can modify this to use a stored persona)
    make_fake_call(user_data["phone_number"], user_id, persona)
    
    return jsonify({"message": "Call triggered successfully!"}), 200


def make_fake_call(phone_number, user_id, persona):
    """Initiate an AI-powered fake call using Twilio."""
    call = twilio_client.calls.create(
        to=phone_number,
        from_=TWILIO_PHONE_NUMBER,
        twiml=f"""
        <Response>
            <Start>
                <Stream url="wss://your-server.com/twilio-stream/{user_id}?persona={persona}" />
            </Start>
        </Response>
        """
    )
    return call.sid

async def generate_ai_call(user_id, persona):
    """Connect to OpenAI Realtime API and stream AI voice responses to Twilio."""
    async with websockets.connect(OPENAI_REALTIME_URL, extra_headers=HEADERS) as ws:
        # Start the AI voice session
        session_start = {
            "type": "session.update",
            "session": {
                "voice": "nova",
                "modalities": ["audio"]
            }
        }
        await ws.send(json.dumps(session_start))
        response = await ws.recv()
        print("Session started:", response)

        # AI System message based on persona
        system_prompt = get_caller_persona(persona)

        # Begin streaming conversation
        while True:
            user_input = await ws.recv()  # Receive user's audio input
            print("User said:", user_input)

            # Detect emergency trigger words and send an SOS alert
            if any(word in user_input.lower() for word in EMERGENCY_WORDS):
                print("⚠️ SOS Triggered! Notifying emergency contacts...")
                send_emergency_alert(user_id)

            # Create an AI-generated response
            ai_response = {
                "type": "conversation.item.create",
                "item": {
                    "type": "message",
                    "role": "assistant",
                    "content": [{"type": "text", "text": f"{system_prompt} {user_input}"}]
                }
            }

            await ws.send(json.dumps(ai_response))
            response_event = await ws.recv()
            response_data = json.loads(response_event)

            # Get AI-generated voice response
            ai_audio = response_data.get("response", {}).get("output", None)

            if ai_audio:
                print("GPT Responding...")
                return ai_audio  # Streaming response


@sockets.route("/twilio-stream/<user_id>")
def twilio_stream(ws, user_id):
    """WebSocket connection between Twilio and OpenAI's AI voice."""
    persona = request.args.get("persona", "friend")
    print(f"Connected to Twilio for {user_id} as {persona}")

    while not ws.closed:
        try:
            user_audio = ws.receive()
            if user_audio:
                print("Streaming user audio to OpenAI...")
                ai_audio = asyncio.run(generate_ai_call(user_id, persona))
                
                # Send AI-generated voice back to Twilio
                if ai_audio:
                    ws.send(ai_audio)
        except Exception as e:
            print(f"Error in Twilio WebSocket stream: {e}")

def send_emergency_alert(user_id):
    """Fetch emergency contacts from Vercel and send an SOS alert via Twilio."""
    response = requests.get(f"{VERCEL_API_URL}/get_user/{user_id}")

    if response.status_code != 200:
        print("🚨 No emergency contacts found or user does not exist!")
        return

    user_data = response.json()
    emergency_contacts = user_data.get("emergency_contacts", [])

    if not emergency_contacts:
        print("⚠️ User has no emergency contacts set!")
        return

    for contact in emergency_contacts:
        message = twilio_client.messages.create(
            body=f"⚠️ Emergency Alert: {user_data.get('name', 'A user')} has triggered an SOS signal. Check on them immediately!",
            from_=TWILIO_PHONE_NUMBER,
            to=contact
        )
        print(f"📩 Emergency SMS sent to {contact}: {message.sid}")

if __name__ == "__main__":
    app.run(debug=True)
