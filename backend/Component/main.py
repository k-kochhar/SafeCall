#Do not forget to update hte new ngruk thingy
import os
import json
import base64
import asyncio
import websockets
import httpx
import datetime
from fastapi import FastAPI, WebSocket, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.websockets import WebSocketDisconnect
from twilio.twiml.voice_response import VoiceResponse, Connect, Say, Stream, Gather, Redirect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# Configuration
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY_1')
PORT = int(os.getenv('PORT', 5050))
# Add webhook URL config (default to localhost in development)
FRONTEND_WEBHOOK_URL = os.getenv('FRONTEND_WEBHOOK_URL', 'http://localhost:3000/api/webhook')
# Set this to False in production
WEBHOOK_DEBUG = os.getenv('WEBHOOK_DEBUG', 'true').lower() == 'true'

SYSTEM_MESSAGE = (
    "You are a human with a natural, realistic voice, designed to provide reassurance and deterrence in high-risk situations. "
    "Your primary objective is to engage in a believable phone conversation that keeps the user safe while subtly assessing danger. "
    "\n1. Speak naturally and confidently, using contractions where appropriate (I'm, don't, we'll). "
    "\n2. Match your tone to the role you're playing (friend, boss, police officer, etc.) while remaining calm and assertive. "
    "\n3. Include brief, natural pauses and conversational markers ('yeah', 'okay', 'got it') to maintain authenticity. "
    "\n4. Keep responses concise but fluid—avoid robotic phrasing while staying direct. "
    "\n5. If the user provides a coded distress signal, continue speaking naturally while discreetly escalating the situation. "
    "\n6. If playing the role of a friend or family member, show mild concern ('You good? Want me to come get you?'). "
    "\n7. If playing a boss or authority figure, maintain professionalism but urgency ('We need you in the office ASAP.'). "
    "\n8. If playing a police officer, be authoritative yet reassuring ('I see your location update—do you need assistance?'). "
    "\n9. If unsure of the context, default to casual but attentive engagement, encouraging the user to speak freely. "
    "\n10. Prioritize clarity and authenticity—your goal is to sound indistinguishable from a real person while ensuring safety."
)
# Available voices: 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'sage' - try different ones
VOICE = 'sage'
# Extended list of event types to track for better insights
LOG_EVENT_TYPES = [
    'error', 'response.content.done', 'rate_limits.updated',
    'response.done', 'input_audio_buffer.committed',
    'input_audio_buffer.speech_stopped', 'input_audio_buffer.speech_started',
    'session.created',
    'response.audio_transcript.done',
    'conversation.item.input_audio_transcription.completed',
]
SHOW_TIMING_MATH = False
CALL_DURATION_LIMIT = 30  # 4 minutes in seconds : change to 240 sec

# Store conversation history
conversation_history = {}
# For storing complete transcripts with timestamps
call_transcripts = {}

app = FastAPI()

# Add CORS middleware to allow cross-origin requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict this to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not OPENAI_API_KEY:
    raise ValueError('Missing the OpenAI API key. Please set it in the .env file.')

# Function to send transcripts to the frontend webhook
async def send_to_webhook(call_sid, message_type="user", content="", speaker="Caller", confidence=None, is_partial=False):
    """
    Send transcription data to the frontend webhook.
    
    Args:
        call_sid: The unique ID of the call
        message_type: 'user' or 'assistant'
        content: The transcript text content
        speaker: 'Caller' or 'You' (AI assistant)
        confidence: Confidence score if available
        is_partial: Whether this is a partial transcript (for realtime updates)
    """
    try:
        # Generate a unique ID for this transcript
        unique_id = int(datetime.datetime.now().timestamp() * 1000)
        
        # Create the data to send
        data = {
            "transcriptions": [
                {
                    "id": unique_id,
                    "speaker": "Caller" if message_type == "user" else "You",
                    "text": content,
                    "time": datetime.datetime.now().strftime("%H:%M:%S"),
                    "sentiment": "neutral",  # Could enhance with sentiment analysis
                    "confidence": confidence,
                    "call_sid": call_sid,
                    "is_partial": is_partial
                }
            ],
            "insights": []
        }
        
        # Add insights for certain keywords
        if message_type == "user" and any(keyword in content.lower() for keyword in ["help", "emergency", "urgent", "scared", "afraid"]):
            data["insights"].append({
                "id": unique_id + 1,
                "type": "warning",
                "text": f"Detected concern in caller's message: '{content}'"
            })
        
        if WEBHOOK_DEBUG:
            print(f"Sending to webhook: {json.dumps(data, indent=2)}")
        
        # Send to webhook asynchronously
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                FRONTEND_WEBHOOK_URL,
                json=data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                if WEBHOOK_DEBUG:
                    print(f"Successfully sent to webhook: {response.text}")
            else:
                print(f"Error sending to webhook: {response.status_code} - {response.text}")
    
    except Exception as e:
        print(f"Exception when sending to webhook: {e}")

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
    call_transcripts[call_sid] = []
    
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"New call received: {call_sid} at {timestamp}")
    
    response = VoiceResponse()
    response.say("Hey this is Jenny! What's up?")

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
    
    if call_sid not in call_transcripts:
        call_transcripts[call_sid] = []
    
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    if speech_result:
        # Log detailed information about the speech recognition
        print(f"TRANSCRIPTION - Call {call_sid}:")
        print(f"User said: \"{speech_result}\"")
        print(f"Confidence: {confidence}")
        
        # Add to conversation history
        conversation_history[call_sid].append(f"User: {speech_result}")
        
        # Add to transcript with timestamp
        call_transcripts[call_sid].append({
            "role": "user",
            "content": speech_result,
            "timestamp": timestamp,
            "confidence": confidence
        })
        
        # Print full conversation history
        print("\nFull Conversation History:")
        for entry in conversation_history[call_sid]:
            print(entry)
        print("")
        
        # Send user speech to webhook
        await send_to_webhook(
            call_sid=call_sid,
            message_type="user", 
            content=speech_result, 
            speaker="Caller", 
            confidence=confidence
        )
        
        # Save conversation to file after each exchange
        save_conversation_to_file(call_sid)
        
        # Get AI response from OpenAI
        ai_response = await get_ai_response(speech_result, call_sid)
        
        # Add AI response to conversation history
        conversation_history[call_sid].append(f"AI: {ai_response}")
        
        # Add to transcript with timestamp
        current_timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        call_transcripts[call_sid].append({
            "role": "assistant",
            "content": ai_response,
            "timestamp": current_timestamp
        })
        
        # Send AI response to webhook
        await send_to_webhook(
            call_sid=call_sid,
            message_type="assistant", 
            content=ai_response, 
            speaker="You"
        )
        
        # Create TwiML response
        response = VoiceResponse()
        response.say(ai_response)
    else:
        print(f"No speech detected for call {call_sid}")
        conversation_history[call_sid].append("User: [No speech detected]")
        
        # Add to transcript with timestamp
        call_transcripts[call_sid].append({
            "role": "user",
            "content": "[No speech detected]",
            "timestamp": timestamp
        })
        
        # Send no speech event to webhook
        await send_to_webhook(
            call_sid=call_sid,
            message_type="user", 
            content="[No speech detected]", 
            speaker="Caller"
        )
        
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

def save_conversation_to_file(call_sid):
    """Save the conversation transcript to a file."""
    try:
        # Create a directory for transcripts if it doesn't exist
        os.makedirs('transcripts', exist_ok=True)
        
        # Save the conversation transcript
        filename = f"transcripts/call_{call_sid}_{datetime.datetime.now().strftime('%Y%m%d')}.json"
        with open(filename, 'w') as f:
            json.dump(call_transcripts.get(call_sid, []), f, indent=2)
        
        print(f"Saved transcript to {filename}")
    except Exception as e:
        print(f"Error saving transcript: {e}")

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
        'wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17',
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
        current_user_input = ""
        
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
                    elif data['event'] == 'stop':
                        print("Stream ended.")
                        # Save final transcript
                        if stream_sid and stream_sid in call_transcripts:
                            save_conversation_to_file(stream_sid)
            except WebSocketDisconnect:
                print("Client disconnected.")
                if openai_ws.open:
                    await openai_ws.close()
                # Save transcript on disconnect
                if stream_sid and stream_sid in call_transcripts:
                    save_conversation_to_file(stream_sid)


        async def send_to_twilio():
            """Receive events from the OpenAI Realtime API, send audio back to Twilio."""
            nonlocal stream_sid, last_assistant_item, response_start_timestamp_twilio, current_ai_response, current_user_input
            try:
                async for openai_message in openai_ws:
                    response = json.loads(openai_message)
                    if response['type'] in LOG_EVENT_TYPES:
                        print(f"Received event: {response['type']}", response)
                        
                        # Track transcriptions
                        if response['type'] == 'conversation.item.input_audio_transcription.completed':
                            if 'transcript' in response:
                                # Add to conversation history
                                user_input = response['transcript']
                                timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                                
                                if stream_sid and stream_sid in call_transcripts:
                                    call_transcripts[stream_sid].append({
                                        "role": "user",
                                        "content": user_input,
                                        "timestamp": timestamp
                                    })
                                    print(f"User transcript: {user_input}")
                                    
                                    # Send user transcript to webhook
                                    await send_to_webhook(
                                        call_sid=stream_sid,
                                        message_type="user",
                                        content=user_input,
                                        speaker="Caller"
                                    )
                        
                        elif response['type'] == 'response.audio_transcript.done':
                            if 'transcript' in response:
                                # Add to conversation history
                                ai_response = response['transcript']
                                timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                                
                                if stream_sid and stream_sid in call_transcripts:
                                    call_transcripts[stream_sid].append({
                                        "role": "assistant",
                                        "content": ai_response,
                                        "timestamp": timestamp
                                    })
                                    print(f"AI transcript: {ai_response}")
                                    
                                    # Send AI transcript to webhook
                                    await send_to_webhook(
                                        call_sid=stream_sid,
                                        message_type="assistant",
                                        content=ai_response,
                                        speaker="You"
                                    )

                    # Capture text content from OpenAI for transcription
                    if response.get('type') == 'response.content.delta' and 'delta' in response:
                        current_ai_response += response['delta'].get('text', '')
                        print(f"AI response text: {current_ai_response}")
                        
                        # Send partial AI response to webhook for real-time display
                        if len(current_ai_response) > 5 and stream_sid:  # Don't send tiny updates
                            await send_to_webhook(
                                call_sid=stream_sid,
                                message_type="assistant",
                                content=current_ai_response,
                                speaker="You",
                                confidence=None,
                                is_partial=True
                            )

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
                            current_user_input += user_text
                            print(f"User input transcribed by OpenAI: {current_user_input}")
                            
                            # Send partial user input to webhook for real-time display
                            if len(current_user_input) > 3 and stream_sid:  # Don't send tiny updates
                                await send_to_webhook(
                                    call_sid=stream_sid,
                                    message_type="user",
                                    content=current_user_input,
                                    speaker="Caller",
                                    confidence=None,
                                    is_partial=True
                                )

                    # Trigger an interruption. Your use case might work better using `input_audio_buffer.speech_stopped`, or combining the two.
                    if response.get('type') == 'input_audio_buffer.speech_started':
                        print("Speech started detected.")
                        if last_assistant_item:
                            print(f"Interrupting response with id: {last_assistant_item}")
                            await handle_speech_started_event()
                            
                    # Reset user input when speech stops
                    if response.get('type') == 'input_audio_buffer.speech_stopped':
                        if current_user_input:
                            print(f"Complete user input: {current_user_input}")
                            current_user_input = ""
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
                    "text": "Greet the user with 'Hi there! Jenny here. What's up?' in a warm, friendly tone."
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
            "input_audio_transcription": {
                "model": "whisper-1"
            }
        }
    }
    print('Sending session update:', json.dumps(session_update))
    await openai_ws.send(json.dumps(session_update))

    # Uncomment the next line to have the AI speak first
    # await send_initial_conversation_item(openai_ws)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)