import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.urlencoded({ extended: false })); // Twilio sends form-encoded by default
app.use(express.json());

// ======= CONFIG =======
const PORT = process.env.PORT || 3000;
const ELEVEN_API_KEY = process.env.ELEVEN_API_KEY; // set on Render
const VOICE_ID = process.env.ELEVEN_VOICE_ID || "EXAVITQu4vr4xnSDxMaL"; // ElevenLabs "Rachel"

// Health check
app.get("/health", (_, res) => res.send("OK"));

// Step 1: Twilio hits this when a call comes in
// Respond with TwiML <Gather> to capture speech and post transcript to /twiml
app.post("/answer", (req, res) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = (req.headers["x-forwarded-proto"] || "https");
  const actionUrl = `${proto}://${host}/twiml`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather input="speech" speechTimeout="auto" action="${actionUrl}" method="POST" language="en-US">
    <Say>Hi, thanks for calling Orderly A I. 
    Please say your name, party size, desired date and time, and your phone number.</Say>
  </Gather>
  <Say>Sorry, I didn't catch that. Goodbye.</Say>
</Response>`;

  res.set("Content-Type", "text/xml");
  res.status(200).send(twiml);
});

// Step 2: Twilio posts SpeechResult here. We generate ElevenLabs MP3 and play it.
app.post("/twiml", async (req, res) => {
  const said = (req.body.SpeechResult || "").trim();
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = (req.headers["x-forwarded-proto"] || "https");

  // Simple non-LLM confirmation text (free)
  const replyText = said
    ? `Got it. I heard: ${said}. Your request has been recorded. If anything is wrong, please call back.`
    : `Thanks for calling. I didn't catch that clearly, please try again.`;

  // Build URL for our TTS endpoint which streams MP3
  const ttsUrl = `${proto}://${host}/tts?text=${encodeURIComponent(replyText)}`;

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${ttsUrl}</Play>
</Response>`;

  res.set("Content-Type", "text/xml");
  res.status(200).send(twiml);
});

// Step 3: Generate MP3 on the fly with ElevenLabs and stream it back
app.get("/tts", async (req, res) => {
  try {
    if (!ELEVEN_API_KEY) {
      res.status(500).send("Missing ELEVEN_API_KEY");
      return;
    }

    const text = (req.query.text || "Hello from Orderly A I").toString();

    const elResp = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!elResp.ok) {
      const msg = await elResp.text();
      console.error("ElevenLabs error:", msg);
      res.status(502).send("TTS failed");
      return;
    }

    res.set("Content-Type", "audio/mpeg");
    res.set("Cache-Control", "public, max-age=60");
    elResp.body.pipe(res);
  } catch (e) {
    console.error(e);
    res.status(500).send("TTS server error");
  }
});

app.listen(PORT, () => console.log(`Server running on :${PORT}`));
