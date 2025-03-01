import os
import base64
import logging
import requests
from flask import Blueprint, request, jsonify
from twilio.rest import Client

call_bp = Blueprint('call', __name__)

# Retrieve Twilio credentials and phone number from environment variables.
TWILIO_ACCOUNT_SID = os.getenv("TWILIO_ACCOUNT_SID")
TWILIO_AUTH_TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
TWILIO_PHONE_NUMBER = os.getenv("TWILIO_PHONE_NUMBER")

# Initialize the Twilio client.
client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

# Retrieve OpenAI realtime API settings.
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_REALTIME_API_URL = os.getenv("OPENAI_REALTIME_API_URL", "https://api.openai.com/v1/realtime")

@call_bp.route('/make-call', methods=['POST'])
def make_call():
    """
    Initiates an outbound call using the Twilio API.
    Expects a JSON payload with:
      - to_number: The target phone number (E.164 format).
      - twiml_url: A publicly accessible URL that returns your TwiML instructions.
    """
    data = request.get_json()
    to_number = data.get("to_number")
    twiml_url = data.get("twiml_url")
    
    if not to_number or not twiml_url:
        return jsonify({"status": "error", "message": "to_number and twiml_url are required"}), 400

    try:
        call = client.calls.create(
            to=to_number,
            from_=TWILIO_PHONE_NUMBER,
            url=twiml_url
        )
        logging.info("Call initiated. SID: %s", call.sid)
        return jsonify({"status": "success", "call_sid": call.sid}), 200
    except Exception as e:
        logging.error("Error initiating call: %s", e)
        return jsonify({"status": "error", "message": str(e)}), 500

@call_bp.route('/media-stream', methods=['POST'])
def media_stream():
    """
    Receives real-time audio media from Twilio.
    Expects a JSON payload with an "event" key:
      - "start": Indicates the beginning of the media stream.
      - "media": Contains a base64-encoded audio payload.
      - "stop": Indicates the end of the media stream.
    """
    data = request.get_json()
    event = data.get("event")
    logging.info("Received media event: %s", event)
    
    if event == "start":
        logging.info("Media stream started.")
        # (Optional) Initialize any stream-specific resources.
    elif event == "media":
        media = data.get("media", {})
        payload = media.get("payload")
        if payload:
            try:
                audio_chunk = base64.b64decode(payload)
                logging.info("Received audio chunk of size: %d bytes", len(audio_chunk))
                # Forward the audio chunk to the OpenAI realtime API.
                openai_response = process_media_chunk(audio_chunk)
                if openai_response:
                    logging.info("OpenAI response: %s", openai_response)
                else:
                    logging.error("No response from OpenAI API.")
            except Exception as e:
                logging.error("Error decoding audio payload: %s", e)
                return jsonify({"status": "error", "message": "Error processing media chunk"}), 500
    elif event == "stop":
        logging.info("Media stream stopped.")
        # (Optional) Clean up any stream-specific resources.
    else:
        logging.warning("Unknown event type: %s", event)
        return jsonify({"status": "error", "message": "Unrecognized event type"}), 400

    return jsonify({"status": "success", "message": "Event processed"}), 200

def process_media_chunk(audio_chunk):
    """
    Forwards an audio chunk to the OpenAI realtime API.
    Returns the JSON response from OpenAI, or None if there's an error.
    """
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/octet-stream"
    }
    try:
        response = requests.post(OPENAI_REALTIME_API_URL, headers=headers, data=audio_chunk)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logging.error("Error in OpenAI realtime API call: %s", e)
        return None

@call_bp.route('/dummy', methods=['GET'])
def dummy_endpoint():
    """
    Dummy endpoint that returns a success JSON response.
    """
    return jsonify({"status": "success", "message": "Dummy endpoint reached"}), 200

