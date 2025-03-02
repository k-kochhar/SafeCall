#Do not forget to update hte new ngruk thingy
import os
import json
import base64
import asyncio
import websockets
from fastapi import FastAPI, WebSocket, Request, Form
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.websockets import WebSocketDisconnect
from twilio.twiml.voice_response import VoiceResponse, Connect, Say, Stream, Gather
from dotenv import load_dotenv
from datetime import datetime

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
WEBHOOK_URL = os.getenv('WEBHOOK_URL', 'http://localhost:3000/api/webhook')

app = FastAPI()

if not OPENAI_API_KEY:
    raise ValueError('Missing the OpenAI API key. Please set it in the .env file.')

def log_formatted_message(message_type, content):
    """Print a formatted log message with clear visual separation."""
    if message_type == "AI_RESPONSE":
        print("\n" + "*"*80)
        print(f"AI RESPONSE:")
        print("*"*80)
        print(content)
        print("*"*80 + "\n")
    elif message_type == "ERROR":
        print("\n" + "!"*80)
        print(f"ERROR:")
        print("!"*80)
        print(content)
        print("!"*80 + "\n")
    elif message_type == "EVENT":
        print("\n" + ">"*80)
        print(f"EVENT: {content}")
        print(">"*80 + "\n")
    else:
        print("\n" + "-"*80)
        print(f"{message_type}: {content}")
        print("-"*80 + "\n")

@app.get("/", response_class=JSONResponse)
async def index_page():
    return {"message": "Twilio Media Stream Server is running!"}

@app.api_route("/incoming-call", methods=["GET", "POST"])
async def handle_incoming_call(request: Request):
    """Handle incoming call and return TwiML response to connect to Media Stream."""
    response = VoiceResponse()
    
    # Add Gather for transcription with partial results
    gather = Gather(
        input='speech',
        action='/transcription-handler',
        method='POST',
        speechModel='phone_call',
        enhanced=True,
        language='en-US',
        speechTimeout='auto',
        profanityFilter=False,
        partialResultCallback='/partial-transcription',
        partialResultCallbackMethod='POST'
    )
    
    # <Say> punctuation to improve text-to-speech flow
    gather.say("Please wait while we connect your call to the A. I. voice assistant, powered by Twilio and the Open-A.I. Realtime API")
    gather.pause(length=1)
    gather.say("O.K. you can start talking!")
    
    response.append(gather)
    
    # Continue with media stream connection
    host = request.url.hostname
    connect = Connect()
    connect.stream(url=f'wss://{host}/media-stream')
    response.append(connect)
    
    return HTMLResponse(content=str(response), media_type="application/xml")

@app.api_route("/transcription-handler", methods=["POST"])
async def handle_transcription(request: Request):
    """Handle transcription results from Gather."""
    form_data = await request.form()
    speech_result = form_data.get('SpeechResult', '')
    confidence = form_data.get('Confidence', '0.0')
    call_sid = form_data.get('CallSid', '')
    
    # Print transcription in a more visible way
    print("\n" + "="*80)
    print(f"TRANSCRIPTION [Call: {call_sid}] [Confidence: {confidence}]")
    print("-"*80)
    print(f"CALLER: {speech_result}")
    print("="*80 + "\n")
    
    # Send transcription to webhook
    if speech_result:
        try:
            # Get current timestamp in MM:SS format
            current_time = datetime.now().strftime("%M:%S")
            
            # Basic sentiment analysis (this is very simple - you might want to use a proper NLP service)
            sentiment = "neutral"
            if any(word in speech_result.lower() for word in ["help", "emergency", "urgent", "scared", "afraid"]):
                sentiment = "urgent"
            elif any(word in speech_result.lower() for word in ["happy", "great", "good", "thanks", "thank"]):
                sentiment = "positive"
            
            # Create data payload
            data = {
                "transcriptions": [
                    {
                        "id": int(datetime.now().timestamp()),  # Use timestamp as ID
                        "speaker": "Caller",
                        "text": speech_result,
                        "time": current_time,
                        "sentiment": sentiment
                    }
                ],
                "insights": []
            }
            
            # Add insights based on content
            if sentiment == "urgent":
                data["insights"].append({
                    "id": int(datetime.now().timestamp()),
                    "type": "warning",
                    "text": f"Detected urgency in caller's message: '{speech_result}'"
                })
            
            # Add confidence as insight
            data["insights"].append({
                "id": int(datetime.now().timestamp()) + 1,
                "type": "info",
                "text": f"Transcription confidence: {confidence}"
            })
            
            # Print the data being sent to webhook
            print(f"Sending to webhook: {json.dumps(data, indent=2)}")
            
            # Send to webhook asynchronously
            asyncio.create_task(send_to_webhook(data))
        except Exception as e:
            print(f"Error processing transcription: {e}")
    
    # Continue the call with another Gather to keep transcribing
    response = VoiceResponse()
    gather = Gather(
        input='speech',
        action='/transcription-handler',
        method='POST',
        speechModel='phone_call',
        enhanced=True,
        language='en-US',
        speechTimeout='auto',
        profanityFilter=False
    )
    
    # Don't say anything this time, just listen
    response.append(gather)
    
    # Also continue with the media stream for the AI conversation
    return HTMLResponse(content=str(response), media_type="application/xml")

@app.api_route("/partial-transcription", methods=["POST"])
async def handle_partial_transcription(request: Request):
    """Handle partial transcription results from Gather."""
    form_data = await request.form()
    unstable_result = form_data.get('UnstableSpeechResult', '')
    call_sid = form_data.get('CallSid', '')
    
    # Print partial transcription in a more visible way
    print("\n" + "-"*80)
    print(f"PARTIAL TRANSCRIPTION [Call: {call_sid}]")
    print("-"*80)
    print(f"CALLER (partial): {unstable_result}")
    print("-"*80 + "\n")
    
    # Send partial transcription to webhook if it's substantial
    if unstable_result and len(unstable_result) > 5:
        try:
            # Get current timestamp in MM:SS format
            current_time = datetime.now().strftime("%M:%S")
            
            # Create data payload for partial result
            data = {
                "transcriptions": [
                    {
                        "id": int(datetime.now().timestamp()),
                        "speaker": "Caller",
                        "text": f"[Partial] {unstable_result}",
                        "time": current_time,
                        "sentiment": "neutral",
                        "is_partial": True
                    }
                ],
                "insights": []
            }
            
            # Print the data being sent to webhook
            print(f"Sending partial result to webhook: {json.dumps(data, indent=2)}")
            
            # Send to webhook asynchronously
            asyncio.create_task(send_to_webhook(data))
        except Exception as e:
            print(f"Error processing partial transcription: {e}")
    
    # This is an asynchronous callback, so we don't need to return TwiML
    return JSONResponse({"status": "received"})

# Update the send_to_webhook function to handle retries
async def send_to_webhook(data, max_retries=3):
    """Send transcription data to the webhook with retries."""
    import aiohttp
    from asyncio import sleep
    
    for attempt in range(max_retries):
        try:
            log_formatted_message("WEBHOOK", f"Sending data to webhook (attempt {attempt+1}/{max_retries})")
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    WEBHOOK_URL,
                    json=data,
                    headers={"Content-Type": "application/json"},
                    timeout=aiohttp.ClientTimeout(total=5)  # 5 second timeout
                ) as response:
                    if response.status != 200:
                        response_text = await response.text()
                        log_formatted_message("ERROR", f"Webhook error: {response.status}")
                        log_formatted_message("ERROR", f"Response: {response_text}")
                        if attempt < max_retries - 1:
                            log_formatted_message("WEBHOOK", f"Retrying in {1 * (attempt + 1)} seconds...")
                            await sleep(1 * (attempt + 1))  # Exponential backoff
                            continue
                    else:
                        response_json = await response.json()
                        log_formatted_message("WEBHOOK", f"Successfully sent data (attempt {attempt+1})")
                        log_formatted_message("WEBHOOK", f"Response: {json.dumps(response_json, indent=2)}")
                        return
        except Exception as e:
            log_formatted_message("ERROR", f"Error in send_to_webhook (attempt {attempt+1}): {e}")
            if attempt < max_retries - 1:
                log_formatted_message("WEBHOOK", f"Retrying in {1 * (attempt + 1)} seconds...")
                await sleep(1 * (attempt + 1))  # Exponential backoff
            else:
                log_formatted_message("ERROR", "Max retries reached, giving up on sending to webhook")

@app.websocket("/media-stream")
async def handle_media_stream(websocket: WebSocket):
    """Handle WebSocket connections between Twilio and OpenAI."""
    log_formatted_message("CONNECTION", "Client connected")
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
        
        async def receive_from_twilio():
            """Receive audio data from Twilio and send it to the OpenAI Realtime API."""
            nonlocal stream_sid, latest_media_timestamp
            try:
                async for message in websocket.iter_text():
                    data = json.loads(message)
                    if data['event'] == 'media' and openai_ws.open:
                        latest_media_timestamp = int(data['media']['timestamp'])
                        audio_append = {
                            "type": "input_audio_buffer.append",
                            "audio": data['media']['payload']
                        }
                        await openai_ws.send(json.dumps(audio_append))
                    elif data['event'] == 'start':
                        stream_sid = data['start']['streamSid']
                        log_formatted_message("CONNECTION", f"Incoming stream has started {stream_sid}")
                        response_start_timestamp_twilio = None
                        latest_media_timestamp = 0
                        last_assistant_item = None
                    elif data['event'] == 'mark':
                        if mark_queue:
                            mark_queue.pop(0)
            except WebSocketDisconnect:
                log_formatted_message("CONNECTION", "Client disconnected")
                if openai_ws.open:
                    await openai_ws.close()

        async def send_to_twilio():
            """Receive events from the OpenAI Realtime API, send audio back to Twilio."""
            nonlocal stream_sid, last_assistant_item, response_start_timestamp_twilio
            try:
                async for openai_message in openai_ws:
                    response = json.loads(openai_message)
                    if response['type'] in LOG_EVENT_TYPES:
                        log_formatted_message("EVENT", f"{response['type']}")
                        print(json.dumps(response, indent=2))

                    if response.get('type') == 'response.content.delta' and 'delta' in response:
                        # Log the AI's text response
                        log_formatted_message("AI_RESPONSE", response['delta']['text'])

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

                    # Trigger an interruption. Your use case might work better using `input_audio_buffer.speech_stopped`, or combining the two.
                    if response.get('type') == 'input_audio_buffer.speech_started':
                        log_formatted_message("EVENT", "Speech started detected")
                        if last_assistant_item:
                            log_formatted_message("EVENT", f"Interrupting response with id: {last_assistant_item}")
                            await handle_speech_started_event()
            except Exception as e:
                log_formatted_message("ERROR", f"Error in send_to_twilio: {e}")
                print(f"Error details: {str(e)}")

        async def handle_speech_started_event():
            """Handle interruption when the caller's speech starts."""
            nonlocal response_start_timestamp_twilio, last_assistant_item
            log_formatted_message("EVENT", "Handling speech started event")
            if mark_queue and response_start_timestamp_twilio is not None:
                elapsed_time = latest_media_timestamp - response_start_timestamp_twilio
                if SHOW_TIMING_MATH:
                    log_formatted_message("TIMING", f"Calculating elapsed time for truncation: {latest_media_timestamp} - {response_start_timestamp_twilio} = {elapsed_time}ms")

                if last_assistant_item:
                    if SHOW_TIMING_MATH:
                        log_formatted_message("TIMING", f"Truncating item with ID: {last_assistant_item}, Truncated at: {elapsed_time}ms")

                    truncate_event = {
                        "type": "conversation.item.truncate",
                        "item_id": last_assistant_item,
                        "content_index": 0,
                        "audio_end_ms": elapsed_time
                    }
                    await openai_ws.send(json.dumps(truncate_event))
                    log_formatted_message("EVENT", f"Sent truncate event: {json.dumps(truncate_event, indent=2)}")

                await websocket.send_json({
                    "event": "clear",
                    "streamSid": stream_sid
                })
                log_formatted_message("EVENT", "Sent clear event to Twilio")

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
                if SHOW_TIMING_MATH:
                    log_formatted_message("TIMING", "Sent mark event to Twilio")

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
    log_formatted_message("SESSION", "Sending initial conversation item")
    log_formatted_message("CONFIG", json.dumps(initial_conversation_item, indent=2))
    await openai_ws.send(json.dumps(initial_conversation_item))
    await openai_ws.send(json.dumps({"type": "response.create"}))
    log_formatted_message("SESSION", "Initial conversation item sent to OpenAI")


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
    log_formatted_message("SESSION", "Initializing OpenAI session")
    log_formatted_message("CONFIG", json.dumps(session_update, indent=2))
    await openai_ws.send(json.dumps(session_update))
    log_formatted_message("SESSION", "Session update sent to OpenAI")

    # Uncomment the next line to have the AI speak first
    # await send_initial_conversation_item(openai_ws)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
