import os
import json
import base64
import asyncio
import logging
import certifi
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.websockets import WebSocketDisconnect

from typing import List
from dotenv import load_dotenv
import uvicorn

# mongodb imports
from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from bson import ObjectId

# twilio imports
import websockets
from twilio.twiml.voice_response import VoiceResponse, Connect, Say, Stream

# Import models from models.py
from models import CallHistory, User

load_dotenv()

PORT = int(os.getenv('PORT', 5050))

# MONGODB CODE

# MongoDB Connection
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI, server_api=ServerApi('1'), tlsCAFile=certifi.where())

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

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY_1')
PORT = int(os.getenv('PORT', 5050))
SYSTEM_MESSAGE = (
    "You are a helpful and bubbly AI assistant who loves to chat about "
    "anything the user is interested in and is prepared to offer them facts. "
    "You have a penchant for dad jokes, owl jokes, and rickrolling – subtly. "
    "Always stay positive, but work in a joke when appropriate."
)
VOICE = 'alloy'
LOG_EVENT_TYPES = [
    'error', 'response.content.done', 'rate_limits.updated',
    'response.done', 'input_audio_buffer.committed',
    'input_audio_buffer.speech_stopped', 'input_audio_buffer.speech_started',
    'session.created'
]
SHOW_TIMING_MATH = False


if not OPENAI_API_KEY:
    raise ValueError('Missing the OpenAI API key. Please set it in the .env file.')

@app.get("/", response_class=JSONResponse)
async def index_page():
    return {"message": "Twilio Media Stream Server is running!"}

# @app.api_route("/incoming-call", methods=["GET", "POST"])
# async def handle_incoming_call(request: Request):
#     """Handle incoming call and return TwiML response to connect to Media Stream."""
#     response = VoiceResponse()
#     # <Say> punctuation to improve text-to-speech flow
#     response.say("Please wait while we connect your call to the A. I. voice assistant, powered by Twilio and the Open-A.I. Realtime API")
#     response.pause(length=1)
#     response.say("O.K. you can start talking!")
#     host = request.url.hostname
#     connect = Connect()
#     connect.stream(url=f'wss://{host}/media-stream')
#     response.append(connect)
#     return HTMLResponse(content=str(response), media_type="application/xml")

# @app.websocket("/media-stream")
# async def handle_media_stream(websocket: WebSocket):
#     """Handle WebSocket connections between Twilio and OpenAI."""
#     print("Client connected")
#     await websocket.accept()

#     async with websockets.connect(
#         'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01',
#         extra_headers={
#             "Authorization": f"Bearer {OPENAI_API_KEY}",
#             "OpenAI-Beta": "realtime=v1"
#         }
#     ) as openai_ws:
#         await initialize_session(openai_ws)

#         # Connection specific state
#         stream_sid = None
#         latest_media_timestamp = 0
#         last_assistant_item = None
#         mark_queue = []
#         response_start_timestamp_twilio = None
        
#         async def receive_from_twilio():
#             """Receive audio data from Twilio and send it to the OpenAI Realtime API."""
#             nonlocal stream_sid, latest_media_timestamp
#             try:
#                 async for message in websocket.iter_text():
#                     data = json.loads(message)
#                     if data['event'] == 'media' and openai_ws.open:
#                         latest_media_timestamp = int(data['media']['timestamp'])
#                         audio_append = {
#                             "type": "input_audio_buffer.append",
#                             "audio": data['media']['payload']
#                         }
#                         await openai_ws.send(json.dumps(audio_append))
#                     elif data['event'] == 'start':
#                         stream_sid = data['start']['streamSid']
#                         print(f"Incoming stream has started {stream_sid}")
#                         response_start_timestamp_twilio = None
#                         latest_media_timestamp = 0
#                         last_assistant_item = None
#                     elif data['event'] == 'mark':
#                         if mark_queue:
#                             mark_queue.pop(0)
#             except WebSocketDisconnect:
#                 print("Client disconnected.")
#                 if openai_ws.open:
#                     await openai_ws.close()

#         async def send_to_twilio():
#             """Receive events from the OpenAI Realtime API, send audio back to Twilio."""
#             nonlocal stream_sid, last_assistant_item, response_start_timestamp_twilio
#             try:
#                 async for openai_message in openai_ws:
#                     response = json.loads(openai_message)
#                     if response['type'] in LOG_EVENT_TYPES:
#                         print(f"Received event: {response['type']}", response)

#                     if response.get('type') == 'response.audio.delta' and 'delta' in response:
#                         audio_payload = base64.b64encode(base64.b64decode(response['delta'])).decode('utf-8')
#                         audio_delta = {
#                             "event": "media",
#                             "streamSid": stream_sid,
#                             "media": {
#                                 "payload": audio_payload
#                             }
#                         }
#                         await websocket.send_json(audio_delta)

#                         if response_start_timestamp_twilio is None:
#                             response_start_timestamp_twilio = latest_media_timestamp
#                             if SHOW_TIMING_MATH:
#                                 print(f"Setting start timestamp for new response: {response_start_timestamp_twilio}ms")

#                         # Update last_assistant_item safely
#                         if response.get('item_id'):
#                             last_assistant_item = response['item_id']

#                         await send_mark(websocket, stream_sid)

#                     # Trigger an interruption. Your use case might work better using `input_audio_buffer.speech_stopped`, or combining the two.
#                     if response.get('type') == 'input_audio_buffer.speech_started':
#                         print("Speech started detected.")
#                         if last_assistant_item:
#                             print(f"Interrupting response with id: {last_assistant_item}")
#                             await handle_speech_started_event()
#             except Exception as e:
#                 print(f"Error in send_to_twilio: {e}")

#         async def handle_speech_started_event():
#             """Handle interruption when the caller's speech starts."""
#             nonlocal response_start_timestamp_twilio, last_assistant_item
#             print("Handling speech started event.")
#             if mark_queue and response_start_timestamp_twilio is not None:
#                 elapsed_time = latest_media_timestamp - response_start_timestamp_twilio
#                 if SHOW_TIMING_MATH:
#                     print(f"Calculating elapsed time for truncation: {latest_media_timestamp} - {response_start_timestamp_twilio} = {elapsed_time}ms")

#                 if last_assistant_item:
#                     if SHOW_TIMING_MATH:
#                         print(f"Truncating item with ID: {last_assistant_item}, Truncated at: {elapsed_time}ms")

#                     truncate_event = {
#                         "type": "conversation.item.truncate",
#                         "item_id": last_assistant_item,
#                         "content_index": 0,
#                         "audio_end_ms": elapsed_time
#                     }
#                     await openai_ws.send(json.dumps(truncate_event))

#                 await websocket.send_json({
#                     "event": "clear",
#                     "streamSid": stream_sid
#                 })

#                 mark_queue.clear()
#                 last_assistant_item = None
#                 response_start_timestamp_twilio = None

#         async def send_mark(connection, stream_sid):
#             if stream_sid:
#                 mark_event = {
#                     "event": "mark",
#                     "streamSid": stream_sid,
#                     "mark": {"name": "responsePart"}
#                 }
#                 await connection.send_json(mark_event)
#                 mark_queue.append('responsePart')

#         await asyncio.gather(receive_from_twilio(), send_to_twilio())

# async def send_initial_conversation_item(openai_ws):
#     """Send initial conversation item if AI talks first."""
#     initial_conversation_item = {
#         "type": "conversation.item.create",
#         "item": {
#             "type": "message",
#             "role": "user",
#             "content": [
#                 {
#                     "type": "input_text",
#                     "text": "Greet the user with 'Hello there! I am an AI voice assistant powered by Twilio and the OpenAI Realtime API. You can ask me for facts, jokes, or anything you can imagine. How can I help you?'"
#                 }
#             ]
#         }
#     }
#     await openai_ws.send(json.dumps(initial_conversation_item))
#     await openai_ws.send(json.dumps({"type": "response.create"}))


# async def initialize_session(openai_ws):
#     """Control initial session with OpenAI."""
#     session_update = {
#         "type": "session.update",
#         "session": {
#             "turn_detection": {"type": "server_vad"},
#             "input_audio_format": "g711_ulaw",
#             "output_audio_format": "g711_ulaw",
#             "voice": VOICE,
#             "instructions": SYSTEM_MESSAGE,
#             "modalities": ["text", "audio"],
#             "temperature": 0.8,
#         }
#     }
#     print('Sending session update:', json.dumps(session_update))
#     await openai_ws.send(json.dumps(session_update))

    # Uncomment the next line to have the AI speak first
    # await send_initial_conversation_item(openai_ws)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], # "*"
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def home():
    return {"message": "SafeCall API is running!"}

# New route to get all users from the Testing.Users collection

def serialize_document(doc):
    """Recursively convert ObjectId fields to strings."""
    if isinstance(doc, list):
        return [serialize_document(d) for d in doc]
    elif isinstance(doc, dict):
        return {k: serialize_document(v) for k, v in doc.items()}
    elif isinstance(doc, ObjectId):
        return str(doc)
    else:
        return doc

@app.get("/all-users/")
async def get_all_users():
    try:
        users = list(users_collection.find())
        users = serialize_document(users)  # Ensure all ObjectIds are serialized
        return {"users": users}
    except Exception as e:
        logging.error(f"Error fetching all users: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# @app.get("/latest-calls/")
# async def get_latest_calls():
#     try:
#         calls = list(users_collection.find({}, {"previous_call_history": 1, "_id": 0}))
#         all_calls = [call for user in calls for call in user.get("previous_call_history", [])]
#         sorted_calls = sorted(all_calls, key=lambda x: x["timestamp"], reverse=True)
#         return {"latest_calls": sorted_calls[:10]}  
#     except Exception as e:
#         logging.error(f"Error fetching latest calls: {e}")
#         raise HTTPException(status_code=500, detail="Database error")

# # when a call is made, the call history is updated
# @app.post("/update-call-history/")
# async def update_call_history(
#     user_id: str = Body(..., embed=True),
#     call_entry: CallHistory = Body(...)
# ):
    
#     user = users_collection.find_one({"_id": ObjectId(user_id)})

#     if not user:
#         logging.warning(f"User with ID {user_id} not found.")
#         raise HTTPException(status_code=404, detail="User not found")
    
#     call_dict = call_entry.model_dump(by_alias=True)  
#     call_dict["_id"] = str(ObjectId())  
    
#     # update the user's call history by appending the new entry
#     result = users_collection.update_one(
#         {"_id": ObjectId(user_id)},
#         {"$push": {"previous_call_history": call_dict}}
#     )

#     if result.modified_count == 0:
#         logging.error("Failed to update call history.")
#         raise HTTPException(status_code=500, detail="Failed to update call history")

#     # retrieve the updated user document
#     updated_user = users_collection.find_one({"_id": ObjectId(user_id)})
#     updated_user["_id"] = str(updated_user["_id"])  # Convert ObjectId to string
    
#     return {"message": "Call history updated successfully!", "updated_user": updated_user}
    
# if __name__ == "__main__":
#     port = int(os.getenv("PORT", 3001))
#     uvicorn.run(app, port=port)

# javier's code
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)

