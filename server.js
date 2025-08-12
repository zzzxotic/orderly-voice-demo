app.get("/tts", async (req, res) => {
  try {
    if (!ELEVEN_API_KEY) return res.status(500).send("Missing ELEVEN_API_KEY");

    const text = (req.query.text || "Hello from Orderly AI").toString();
    const voiceId = VOICE_ID || "21m00Tcm4TlvDq8ikWAM";

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=2&output_format=mp3_44100_128`;

    const elResp = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVEN_API_KEY,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      })
    });

    if (!elResp.ok) {
      const body = await elResp.text();
      console.error("ElevenLabs error:", elResp.status, body);
      return res.status(502).send(`TTS failed (${elResp.status})`);
    }

    res.set("Content-Type", "audio/mpeg");
    res.set("Cache-Control", "public, max-age=60");
    elResp.body.pipe(res);
  } catch (e) {
    console.error(e);
    res.status(500).send("TTS server error");
  }
});
