# Orderly Voice Demo (Twilio + ElevenLabs) — Free Demo

One tiny Node server that:
- Answers a Twilio call with <Gather input="speech">
- Receives transcript
- Streams an ElevenLabs MP3 back to the caller with <Play>

## Deploy (Render free tier)
1. Fork or push this repo to GitHub.
2. Create a Web Service on https://render.com
   - Build: `npm install`
   - Start: `npm start`
   - Environment:
     - `ELEVEN_API_KEY` = your ElevenLabs key
     - (optional) `ELEVEN_VOICE_ID` = a different voice id
3. After deploy, visit `/health` to see `OK`.

## Connect Twilio
1. Twilio Console → Phone Numbers → Active Numbers → click your number.
2. Voice & Fax → A CALL COMES IN → Webhook (HTTP POST) →
   `https://YOUR-RENDER-APP.onrender.com/answer`
3. Save. (Verify your caller ID on trial.)

## Test
Call your Twilio number, speak; you’ll hear a natural voice reply via ElevenLabs.

## Local dev (optional)
- `ELEVEN_API_KEY=... node server.js`
- Use `ngrok http 3000` and point Twilio to `https://.../answer`.
