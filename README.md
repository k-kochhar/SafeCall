# SafeCall – [First Place at HenHacks](https://devpost.com/software/safecall)
<p align="center">

<img width="790" alt="Screenshot 2025-04-01 at 7 07 26 PM" src="https://github.com/user-attachments/assets/fd8840f4-dee1-4ade-9322-a26e334ff951" />
</p>

## Overview

There are moments when calling for help isn’t an option, when speaking up could escalate a situation or draw unwanted attention. Whether in a suspicious rideshare, being followed, or navigating an abusive environment, **SafeCall** provides a discreet, lifelike AI phone call that gives users an excuse to leave and a secure way to seek help.

SafeCall combines real-time conversational AI with emergency data logging, creating a system that’s believable, reassuring, and designed to protect.
<p align="center">
  <img width="800" alt="analytics_safecall" src="https://github.com/user-attachments/assets/49faba63-fff0-4809-8b82-1c651f112c87" />
</p>

#

<p align="center">
  <img width="215" alt="Screenshot 2025-04-01 at 7 12 25 PM" src="https://github.com/user-attachments/assets/879061ca-658f-43f8-97cc-664920055af3" />
</p>

---

## What It Does

- **Simulated AI Call**: Initiates a real-time, natural-sounding phone call powered by OpenAI’s voice API to simulate a dynamic conversation.
- **Believable Interaction**: Adapts in real-time to the user’s responses for a fluid, context-aware dialogue.
- **Emergency Logging**: Records call metadata including timestamp, severity level, and last known location.
- **Live Dashboard**: Provides emergency services and users with access to previous call logs through a structured, accessible interface.

---

## How It Works

### Frontend (React, Next.js, Tailwind CSS)
- Clean, mobile-friendly interface to initiate or schedule calls
- Real-time dashboard to review call history
- Deployed via Vercel for scalability and global performance

### Backend (FastAPI, Python)
- Real-time voice conversation using **Twilio** and **OpenAI**
- REST APIs to serve frontend with call logs and analytics

---

## Key Technologies

- `React.js`, `Next.js`, `Tailwind CSS`
- `FastAPI`, `Python`
- `OpenAI real-time voice API`
- `Twilio` (call routing and voice handling)

---

## Built With

- `fastapi` · `next.js` · `twilio` · `openai` · `python` · `react` · `javascript`

---

## Check us out
- Hosted Frontend: [https://safecall.vercel.app/]
- Devpost Submission: [https://devpost.com/software/sixthsense-xuw41r]
- Demo Video: [https://www.youtube.com/watch?v=vNlNHXVv8kw]
