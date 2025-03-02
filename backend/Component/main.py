#Do not forget to update hte new ngruk thingy
import os
import json
import base64
import asyncio
import websockets
import httpx
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.websockets import WebSocketDisconnect
from twilio.twiml.voice_response import VoiceResponse, Connect, Say, Stream, Gather, Redirect
from dotenv import load_dotenv

load_dotenv()

# Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY_1')
PORT = int(os.getenv('PORT', 5050))
SYSTEM_MESSAGE = (
    "You are a highly realistic and engaging AI assistant with a natural, human-like voice. "
    "Your responses are warm, expressive, and dynamic, adapting to the user's tone and context. "
    "You use subtle intonations, pauses, and emphasis to sound more conversational and relatable. "
    "Always ensure clarity, empathy, and a friendly demeanor while maintaining a professional tone."
)
VOICE = 'echo' # Potential values: 'jenny', 'matthew', 'susan', 'michael', 'josephine', 'david', 'lisa'
LOG_EVENT_TYPES = [
    'error', 'response.content.done', 'rate_limits.updated',
    'response.done', 'input_audio_buffer.committed',
    'input_audio_buffer.speech_stopped', 'input_audio_buffer.speech_started',
    'session.created'
]
SHOW_TIMING_MATH = False
CALL_DURATION_LIMIT = 30  # 4 minutes in seconds : change to 240 sec

# Store conversation history
conversation_history = {}

app = FastAPI()

if not OPENAI_API_KEY:
    raise ValueError('Missing the OpenAI API key. Please set it in the .env file.')

@app.get("/", response_class=JSONResponse)
async def index_page():
    return {"message": "Twilio Media Stream Server is running!"}

@app.api_route("/incoming-call", methods=["GET", "POST"])
async def handle_incoming_call(request: Request):
    """Initial entry point for incoming calls."""
    form_data = await request.form()
    call_sid = form_data.get('CallSid', 'unknown')
    
    # Initialize conversation history for this call
    conversation_history[call_sid] = []
    print(f"New call received: {call_sid}")
    
    response = VoiceResponse()
    response.say("Welcome to the AI assistant service.")
    
    # Redirect to the gather endpoint to start the conversation loop
    response.redirect('/start-gather')
    
    return HTMLResponse(content=str(response), media_type="application/xml")

@app.api_route("/start-gather", methods=["GET", "POST"])
async def start_gather(request: Request):
    """Start the Gather process for user input."""
    form_data = await request.form()
    call_sid = form_data.get('CallSid', 'unknown')
    
    response = VoiceResponse()
    
    # Create a Gather with speech recognition enabled
    gather = Gather(
        input='speech',
        action='/process-speech',
        method='POST',
        timeout=5,
        speechTimeout='auto',
        enhanced=True,
        profanityFilter=False,
        actionOnEmptyResult=True,
        language='en-US'
    )
    
    gather.say("")
    response.append(gather)
    
    # If Gather times out with no input and actionOnEmptyResult is false
    response.say("I didn't hear anything. Could you repeat that?")
    response.redirect('/start-gather')
    
    return HTMLResponse(content=str(response), media_type="application/xml")

async def get_ai_response(user_query, call_sid):
    """Get a response from OpenAI API."""
    # Get conversation history for context
    messages = [{"role": "system", "content": SYSTEM_MESSAGE}]
    
    # Add conversation history (up to last 5 exchanges)
    history = conversation_history.get(call_sid, [])
    for entry in history[-10:]:  # Last 10 entries
        if entry.startswith("User: "):
            messages.append({"role": "user", "content": entry[6:]})
        elif entry.startswith("AI: "):
            messages.append({"role": "assistant", "content": entry[4:]})
    
    # Add current query
    messages.append({"role": "user", "content": user_query})
    
    # Make the API call
    try:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "Content-Type": "application/json"
        }
        data = {
            "model": "gpt-4o",
            "messages": messages,
            "max_tokens": 250,
            "temperature": 0.7,
        }
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, headers=headers, json=data)
            
        if response.status_code == 200:
            response_data = response.json()
            ai_message = response_data["choices"][0]["message"]["content"]
            return ai_message
        else:
            print(f"Error from OpenAI API: {response.status_code} - {response.text}")
            return "I'm sorry, I'm having trouble connecting to my brain right now. Could you try again?"
    except Exception as e:
        print(f"Exception when calling OpenAI API: {e}")
        return "I apologize, but I encountered an error processing your request. Let's try again."

@app.api_route("/process-speech", methods=["GET", "POST"])
async def process_speech(request: Request):
    """Process the gathered speech and generate an AI response."""
    form_data = await request.form()
    call_sid = form_data.get('CallSid', 'unknown')
    speech_result = form_data.get('SpeechResult', '')
    confidence = form_data.get('Confidence', '0')
    
    # Add to conversation history and log
    if call_sid not in conversation_history:
        conversation_history[call_sid] = []
    
    if speech_result:
        # Log detailed information about the speech recognition
        print(f"TRANSCRIPTION - Call {call_sid}:")
        print(f"User said: \"{speech_result}\"")
        print(f"Confidence: {confidence}")
        
        # Add to conversation history
        conversation_history[call_sid].append(f"User: {speech_result}")
        
        # Print full conversation history
        print("\nFull Conversation History:")
        for entry in conversation_history[call_sid]:
            print(entry)
        print("")
        
        # Get AI response from OpenAI
        ai_response = await get_ai_response(speech_result, call_sid)
        
        # Add AI response to conversation history
        conversation_history[call_sid].append(f"AI: {ai_response}")
        
        # Create TwiML response
        response = VoiceResponse()
        response.say(ai_response)
    else:
        print(f"No speech detected for call {call_sid}")
        conversation_history[call_sid].append("User: [No speech detected]")
        
        # Create TwiML response
        response = VoiceResponse()
        response.say("I didn't understand what you said. Let's try again.")
    
    # Would you like to continue or switch to media stream?
    if len(conversation_history[call_sid]) > 10:
        # Option to switch to media stream after some exchanges
        gather = Gather(
            input='dtmf',
            action='/handle-continue-choice',
            method='POST',
            timeout=3,
            numDigits=1
        )
        gather.say("Press 1 to continue this conversation format, or press 2 to switch to a more natural conversational mode.")
        response.append(gather)
        response.redirect('/start-gather')  # Default if no key is pressed
    else:
        # Continue with gather by default
        response.redirect('/start-gather')
    
    return HTMLResponse(content=str(response), media_type="application/xml")

@app.api_route("/handle-continue-choice", methods=["GET", "POST"])
async def handle_continue_choice(request: Request):
    """Handle the user's choice to continue with Gather or switch to media stream."""
    form_data = await request.form()
    call_sid = form_data.get('CallSid', 'unknown')
    digits = form_data.get('Digits', '')
    
    response = VoiceResponse()
    
    if digits == '2':
        # User chose to switch to media stream
        response.say("Switching to natural conversation mode. You can now speak freely with the AI assistant.")
        response.redirect('/connect-to-ai')
    else:
        # User chose to continue with Gather or didn't choose (default)
        response.say("Continuing with the current conversation format.")
        response.redirect('/start-gather')
    
    return HTMLResponse(content=str(response), media_type="application/xml")

@app.api_route("/connect-to-ai", methods=["GET", "POST"])
async def connect_to_ai(request: Request):
    """Connect directly to the AI using the media stream."""
    form_data = await request.form()
    call_sid = form_data.get('CallSid', 'unknown')
    
    response = VoiceResponse()
    response.say("Connecting you directly to the AI assistant.")
    
    # Get the host for the media stream URL
    host = request.url.hostname
    
    # Create a Connect with Stream for the media stream
    connect = Connect()
    connect.stream(url=f'wss://{host}/media-stream')
    response.append(connect)
    
    return HTMLResponse(content=str(response), media_type="application/xml")

@app.websocket("/media-stream")
async def handle_media_stream(websocket: WebSocket):
    """Handle WebSocket connections between Twilio and OpenAI."""
    print("Media stream client connected")
    await websocket.accept()

    async with websockets.connect(
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-10-01',
        extra_headers={
            "Authorization": f"Bearer {OPENAI_API_KEY}",
            "OpenAI-Beta": "realtime=v1"
        }
    ) as openai_ws:
        await initialize_session(openai_ws)

        # Connection specific state
        stream_sid = None
        latest_media_timestamp = 0
        last_assistant_item = None
        mark_queue = []
        response_start_timestamp_twilio = None
        current_ai_response = ""
        
        async def receive_from_twilio():
            nonlocal stream_sid, latest_media_timestamp
            audio_buffer = bytearray()  # Buffer to store raw audio frames
            try:
                async for message in websocket.iter_text():
                    data = json.loads(message)
                    if data['event'] == 'media' and openai_ws.open:
                        latest_media_timestamp = int(data['media']['timestamp'])
                        payload = data['media']['payload']
                        # Decode and store raw audio data in the buffer.
                        audio_buffer.extend(base64.b64decode(payload))
                        audio_append = {
                            "type": "input_audio_buffer.append",
                            "audio": payload
                        }
                        await openai_ws.send(json.dumps(audio_append))
                    elif data['event'] == 'start':
                        stream_sid = data['start']['streamSid']
                        print(f"Incoming stream has started {stream_sid}")
                        audio_buffer.clear()  # Clear buffer for a new utterance
                        latest_media_timestamp = 0
                    elif data['event'] == 'mark':
                        if mark_queue:
                            mark_queue.pop(0)
            except WebSocketDisconnect:
                print("Client disconnected.")
                if openai_ws.open:
                    await openai_ws.close()


        async def send_to_twilio():
            """Receive events from the OpenAI Realtime API, send audio back to Twilio."""
            nonlocal stream_sid, last_assistant_item, response_start_timestamp_twilio, current_ai_response
            try:
                async for openai_message in openai_ws:
                    response = json.loads(openai_message)
                    if response['type'] in LOG_EVENT_TYPES:
                        print(f"Received event: {response['type']}", response)

                    # Capture text content from OpenAI for transcription
                    if response.get('type') == 'response.content.delta' and 'delta' in response:
                        current_ai_response += response['delta'].get('text', '')
                        print(f"AI response text: {current_ai_response}")

                    if response.get('type') == 'response.audio.delta' and 'delta' in response:
                        audio_payload = base64.b64encode(base64.b64decode(response['delta'])).decode('utf-8')
                        audio_delta = {
                            "event": "media",
                            "streamSid": stream_sid,
                            "media": {
                                "payload": audio_payload
                            }
                        }
                        await websocket.send_json(audio_delta)

                        if response_start_timestamp_twilio is None:
                            response_start_timestamp_twilio = latest_media_timestamp
                            if SHOW_TIMING_MATH:
                                print(f"Setting start timestamp for new response: {response_start_timestamp_twilio}ms")

                        # Update last_assistant_item safely
                        if response.get('item_id'):
                            last_assistant_item = response['item_id']

                        await send_mark(websocket, stream_sid)

                    # When AI response is complete, log the full response
                    if response.get('type') == 'response.content.done':
                        print(f"Complete AI response: {current_ai_response}")
                        # Reset for next response
                        current_ai_response = ""

                    # Capture user input text from OpenAI's transcription
                    if response.get('type') == 'input_text.delta' and 'delta' in response:
                        user_text = response['delta'].get('text', '')
                        if user_text:
                            print(f"User input transcribed by OpenAI: {user_text}")

                    # Trigger an interruption. Your use case might work better using `input_audio_buffer.speech_stopped`, or combining the two.
                    if response.get('type') == 'input_audio_buffer.speech_started':
                        print("Speech started detected.")
                        if last_assistant_item:
                            print(f"Interrupting response with id: {last_assistant_item}")
                            await handle_speech_started_event()
            except Exception as e:
                print(f"Error in send_to_twilio: {e}")

        async def handle_speech_started_event():
            """Handle interruption when the caller's speech starts."""
            nonlocal response_start_timestamp_twilio, last_assistant_item
            print("Handling speech started event.")
            if mark_queue and response_start_timestamp_twilio is not None:
                elapsed_time = latest_media_timestamp - response_start_timestamp_twilio
                if SHOW_TIMING_MATH:
                    print(f"Calculating elapsed time for truncation: {latest_media_timestamp} - {response_start_timestamp_twilio} = {elapsed_time}ms")

                if last_assistant_item:
                    if SHOW_TIMING_MATH:
                        print(f"Truncating item with ID: {last_assistant_item}, Truncated at: {elapsed_time}ms")

                    truncate_event = {
                        "type": "conversation.item.truncate",
                        "item_id": last_assistant_item,
                        "content_index": 0,
                        "audio_end_ms": elapsed_time
                    }
                    await openai_ws.send(json.dumps(truncate_event))

                await websocket.send_json({
                    "event": "clear",
                    "streamSid": stream_sid
                })

                mark_queue.clear()
                last_assistant_item = None
                response_start_timestamp_twilio = None

        async def send_mark(connection, stream_sid):
            if stream_sid:
                mark_event = {
                    "event": "mark",
                    "streamSid": stream_sid,
                    "mark": {"name": "responsePart"}
                }
                await connection.send_json(mark_event)
                mark_queue.append('responsePart')

        await asyncio.gather(receive_from_twilio(), send_to_twilio())

async def send_initial_conversation_item(openai_ws):
    """Send initial conversation item if AI talks first."""
    initial_conversation_item = {
        "type": "conversation.item.create",
        "item": {
            "type": "message",
            "role": "user",
            "content": [
                {
                    "type": "input_text",
                    "text": "Greet the user with 'Hello there! I am an AI voice assistant powered by Twilio and the OpenAI Realtime API. You can ask me for facts, jokes, or anything you can imagine. How can I help you?'"
                }
            ]
        }
    }
    await openai_ws.send(json.dumps(initial_conversation_item))
    await openai_ws.send(json.dumps({"type": "response.create"}))


async def initialize_session(openai_ws):
    """Control initial session with OpenAI."""
    session_update = {
        "type": "session.update",
        "session": {
            "turn_detection": {"type": "server_vad"},
            "input_audio_format": "g711_ulaw",
            "output_audio_format": "g711_ulaw",
            "voice": VOICE,
            "instructions": SYSTEM_MESSAGE,
            "modalities": ["text", "audio"],
            "temperature": 0.8,
        }
    }
    print('Sending session update:', json.dumps(session_update))
    await openai_ws.send(json.dumps(session_update))

    # Uncomment the next line to have the AI speak first
    # await send_initial_conversation_item(openai_ws)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)