# Do not forget to update the new ngruk thingy
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
FRONTEND_WEBHOOK_URL = os.getenv('FRONTEND_WEBHOOK_URL', 'http://localhost:3000/api/webhook')
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
# Available voices: 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer', 'sage'
VOICE = 'sage'
LOG_EVENT_TYPES = [
    'error', 'response.content.done', 'rate_limits.updated',
    'response.done', 'input_audio_buffer.committed',
    'input_audio_buffer.speech_stopped', 'input_audio_buffer.speech_started',
    'session.created',
    'response.audio_transcript.done',
    'conversation.item.input_audio_transcription.completed',
]
SHOW_TIMING_MATH = False
CALL_DURATION_LIMIT = 30  # 30 seconds (change to 240 for 4 minutes)

# Store conversation history and transcripts
conversation_history = {}
call_transcripts = {}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if not OPENAI_API_KEY:
    raise ValueError('Missing the OpenAI API key. Please set it in the .env file.')

async def send_to_webhook(call_sid, message_type="user", content="", speaker="Caller", confidence=None, is_partial=False):
    """
    Send transcription data to the frontend webhook.
    """
    try:
        unique_id = int(datetime.datetime.now().timestamp() * 1000)
        data = {
            "transcriptions": [
                {
                    "id": unique_id,
                    "speaker": "Caller" if message_type == "user" else "You",
                    "text": content,
                    "time": datetime.datetime.now().strftime("%H:%M:%S"),
                    "sentiment": "neutral",
                    "confidence": confidence,
                    "call_sid": call_sid,
                    "is_partial": is_partial
                }
            ],
            "insights": []
        }
        if message_type == "user" and any(keyword in content.lower() for keyword in ["help", "emergency", "urgent", "scared", "afraid"]):
            data["insights"].append({
                "id": unique_id + 1,
                "type": "warning",
                "text": f"Detected concern in caller's message: '{content}'"
            })
        if WEBHOOK_DEBUG:
            print(f"Sending to webhook: {json.dumps(data, indent=2)}")
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
    conversation_history[call_sid] = []
    call_transcripts[call_sid] = []
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"New call received: {call_sid} at {timestamp}")
    response = VoiceResponse()
    # Wrap text in <speak> tags to enable SSML features
    response.say("<speak>Hey, this is Jenny! What's up?</speak>", voice=VOICE)
    response.redirect('/start-gather')
    return HTMLResponse(content=str(response), media_type="application/xml")

@app.api_route("/start-gather", methods=["GET", "POST"])
async def start_gather(request: Request):
    """Start the Gather process for user input."""
    form_data = await request.form()
    call_sid = form_data.get('CallSid', 'unknown')
    response = VoiceResponse()
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
    # Optionally, you can add SSML to your gather prompt (here it's empty)
    gather.say("<speak></speak>", voice=VOICE)
    response.append(gather)
    response.say("<speak>I didn't hear anything. Could you repeat that?</speak>", voice=VOICE)
    response.redirect('/start-gather')
    return HTMLResponse(content=str(response), media_type="application/xml")

async def get_ai_response(user_query, call_sid):
    """Get a response from the OpenAI API."""
    messages = [{"role": "system", "content": SYSTEM_MESSAGE}]
    history = conversation_history.get(call_sid, [])
    for entry in history[-10:]:
        if entry.startswith("User: "):
            messages.append({"role": "user", "content": entry[6:]})
        elif entry.startswith("AI: "):
            messages.append({"role": "assistant", "content": entry[4:]})
    messages.append({"role": "user", "content": user_query})
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
    if call_sid not in conversation_history:
        conversation_history[call_sid] = []
    if call_sid not in call_transcripts:
        call_transcripts[call_sid] = []
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    response = VoiceResponse()
    if speech_result:
        print(f"TRANSCRIPTION - Call {call_sid}:")
        print(f"User said: \"{speech_result}\"")
        print(f"Confidence: {confidence}")
        conversation_history[call_sid].append(f"User: {speech_result}")
        call_transcripts[call_sid].append({
            "role": "user",
            "content": speech_result,
            "timestamp": timestamp,
            "confidence": confidence
        })
        print("\nFull Conversation History:")
        for entry in conversation_history[call_sid]:
            print(entry)
        print("")
        await send_to_webhook(
            call_sid=call_sid,
            message_type="user", 
            content=speech_result, 
            speaker="Caller", 
            confidence=confidence
        )
        save_conversation_to_file(call_sid)
        ai_response = await get_ai_response(speech_result, call_sid)
        conversation_history[call_sid].append(f"AI: {ai_response}")
        current_timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        call_transcripts[call_sid].append({
            "role": "assistant",
            "content": ai_response,
            "timestamp": current_timestamp
        })
        await send_to_webhook(
            call_sid=call_sid,
            message_type="assistant", 
            content=ai_response, 
            speaker="You"
        )
        # Use SSML markup so the AI response sounds more natural.
        response.say(f"<speak>{ai_response}</speak>", voice=VOICE)
    else:
        print(f"No speech detected for call {call_sid}")
        conversation_history[call_sid].append("User: [No speech detected]")
        call_transcripts[call_sid].append({
            "role": "user",
            "content": "[No speech detected]",
            "timestamp": timestamp
        })
        await send_to_webhook(
            call_sid=call_sid,
            message_type="user", 
            content="[No speech detected]", 
            speaker="Caller"
        )
        response.say("<speak>I didn't understand what you said. Let's try again.</speak>", voice=VOICE)
    if len(conversation_history[call_sid]) > 10:
        gather = Gather(
            input='dtmf',
            action='/handle-continue-choice',
            method='POST',
            timeout=3,
            numDigits=1
        )
        gather.say("<speak>Press 1 to continue this conversation format, or press 2 to switch to a more natural conversational mode.</speak>", voice=VOICE)
        response.append(gather)
        response.redirect('/start-gather')
    else:
        response.redirect('/start-gather')
    return HTMLResponse(content=str(response), media_type="application/xml")

def save_conversation_to_file(call_sid):
    """Save the conversation transcript to a file."""
    try:
        os.makedirs('transcripts', exist_ok=True)
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
        response.say("<speak>Switching to natural conversation mode. You can now speak freely with the AI assistant.</speak>", voice=VOICE)
        response.redirect('/connect-to-ai')
    else:
        response.say("<speak>Continuing with the current conversation format.</speak>", voice=VOICE)
        response.redirect('/start-gather')
    return HTMLResponse(content=str(response), media_type="application/xml")

@app.api_route("/connect-to-ai", methods=["GET", "POST"])
async def connect_to_ai(request: Request):
    """Connect directly to the AI using the media stream."""
    form_data = await request.form()
    call_sid = form_data.get('CallSid', 'unknown')
    response = VoiceResponse()
    response.say("<speak>Connecting you directly to the AI assistant.</speak>", voice=VOICE)
    host = request.url.hostname
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
        stream_sid = None
        latest_media_timestamp = 0
        last_assistant_item = None
        mark_queue = []
        response_start_timestamp_twilio = None
        current_ai_response = ""
        current_user_input = ""
        
        async def receive_from_twilio():
            nonlocal stream_sid, latest_media_timestamp
            audio_buffer = bytearray()
            try:
                async for message in websocket.iter_text():
                    data = json.loads(message)
                    if data['event'] == 'media' and openai_ws.open:
                        latest_media_timestamp = int(data['media']['timestamp'])
                        payload = data['media']['payload']
                        audio_buffer.extend(base64.b64decode(payload))
                        audio_append = {
                            "type": "input_audio_buffer.append",
                            "audio": payload
                        }
                        await openai_ws.send(json.dumps(audio_append))
                    elif data['event'] == 'start':
                        stream_sid = data['start']['streamSid']
                        print(f"Incoming stream has started {stream_sid}")
                        audio_buffer.clear()
                        latest_media_timestamp = 0
                    elif data['event'] == 'mark':
                        if mark_queue:
                            mark_queue.pop(0)
                    elif data['event'] == 'stop':
                        print("Stream ended.")
                        if stream_sid and stream_sid in call_transcripts:
                            save_conversation_to_file(stream_sid)
            except WebSocketDisconnect:
                print("Client disconnected.")
                if openai_ws.open:
                    await openai_ws.close()
                if stream_sid and stream_sid in call_transcripts:
                    save_conversation_to_file(stream_sid)

        async def send_to_twilio():
            nonlocal stream_sid, last_assistant_item, response_start_timestamp_twilio, current_ai_response, current_user_input
            try:
                async for openai_message in openai_ws:
                    response_data = json.loads(openai_message)
                    if response_data['type'] in LOG_EVENT_TYPES:
                        print(f"Received event: {response_data['type']}", response_data)
                        if response_data['type'] == 'conversation.item.input_audio_transcription.completed':
                            if 'transcript' in response_data:
                                user_input = response_data['transcript']
                                timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                                if stream_sid and stream_sid in call_transcripts:
                                    call_transcripts[stream_sid].append({
                                        "role": "user",
                                        "content": user_input,
                                        "timestamp": timestamp
                                    })
                                    print(f"User transcript: {user_input}")
                                    await send_to_webhook(
                                        call_sid=stream_sid,
                                        message_type="user",
                                        content=user_input,
                                        speaker="Caller"
                                    )
                        elif response_data['type'] == 'response.audio_transcript.done':
                            if 'transcript' in response_data:
                                ai_response = response_data['transcript']
                                timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                                if stream_sid and stream_sid in call_transcripts:
                                    call_transcripts[stream_sid].append({
                                        "role": "assistant",
                                        "content": ai_response,
                                        "timestamp": timestamp
                                    })
                                    print(f"AI transcript: {ai_response}")
                                    await send_to_webhook(
                                        call_sid=stream_sid,
                                        message_type="assistant",
                                        content=ai_response,
                                        speaker="You"
                                    )
                    if response_data.get('type') == 'response.content.delta' and 'delta' in response_data:
                        current_ai_response += response_data['delta'].get('text', '')
                        print(f"AI response text: {current_ai_response}")
                        if len(current_ai_response) > 5 and stream_sid:
                            await send_to_webhook(
                                call_sid=stream_sid,
                                message_type="assistant",
                                content=current_ai_response,
                                speaker="You",
                                confidence=None,
                                is_partial=True
                            )
                    if response_data.get('type') == 'response.audio.delta' and 'delta' in response_data:
                        audio_payload = base64.b64encode(base64.b64decode(response_data['delta'])).decode('utf-8')
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
                        if response_data.get('item_id'):
                            last_assistant_item = response_data['item_id']
                        await send_mark(websocket, stream_sid)
                    if response_data.get('type') == 'response.content.done':
                        print(f"Complete AI response: {current_ai_response}")
                        current_ai_response = ""
                    if response_data.get('type') == 'input_text.delta' and 'delta' in response_data:
                        user_text = response_data['delta'].get('text', '')
                        if user_text:
                            current_user_input += user_text
                            print(f"User input transcribed by OpenAI: {current_user_input}")
                            if len(current_user_input) > 3 and stream_sid:
                                await send_to_webhook(
                                    call_sid=stream_sid,
                                    message_type="user",
                                    content=current_user_input,
                                    speaker="Caller",
                                    confidence=None,
                                    is_partial=True
                                )
                    if response_data.get('type') == 'input_audio_buffer.speech_started':
                        print("Speech started detected.")
                        if last_assistant_item:
                            print(f"Interrupting response with id: {last_assistant_item}")
                            await handle_speech_started_event()
                    if response_data.get('type') == 'input_audio_buffer.speech_stopped':
                        if current_user_input:
                            print(f"Complete user input: {current_user_input}")
                            current_user_input = ""
            except Exception as e:
                print(f"Error in send_to_twilio: {e}")

        async def handle_speech_started_event():
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