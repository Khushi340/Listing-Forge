import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

if (!process.env.GROQ_API_KEY) {
  console.error("❌ GROQ_API_KEY not found in .env");
  process.exit(1);
}

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1", // change this
});

app.post("/optimize", async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Missing prompt" });

    const response = await client.chat.completions.create({
      model: "llama-3.1-8b-instant", // change this — free and fast
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.choices[0].message.content;
    console.log("🧠 Raw (first 300):", text.slice(0, 300));

    const clean = text
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error("❌ JSON parse failed:", text);
      return res.status(500).json({ error: "AI returned invalid JSON" });
    }

    res.json(parsed);
  } catch (err) {
    console.error("💥 Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
