// server/index.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    methods: ["GET", "POST"],
  })
);

const PORT = process.env.PORT || 5000;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ✅ Stable model name
const MODEL_NAME = "gemini-3.1-flash-lite-preview";
        

// ---------- TEST ROUTE ----------
app.get("/", (req, res) => {
  res.send("✅ Smart ClassRoom Server is running");
});

// ---------- CHAT ENDPOINT ----------
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: "Message is required" });

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const result = await model.generateContent(message);
    const text = result.response.text();

    res.json({ reply: text });
  } catch (err) {
    console.error("❌ Chatbot error:", err);
    res.status(500).json({ error: "Chatbot failed to generate response", details: err.message });
  }
});

// ---------- IDEA GENERATOR ----------
app.post("/api/ideas/generate", async (req, res) => {
  try {
    const { idea } = req.body;
    if (!idea) return res.status(400).json({ error: "Idea input is required" });

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
      A student has this rough FYP idea: "${idea}".
      Generate 3 improved Final Year Project ideas in strict JSON format:
      [
        {
          "title": "Project title",
          "problem": "Problem statement",
          "keyModules": ["Module 1", "Module 2"],
          "tech": ["Technology1", "Technology2"],
          "difficulty": "Beginner/Intermediate/Advanced",
          "noveltyScore": "1-10"
        }
      ]
      Respond ONLY with valid JSON.
    `;
    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(text);
    res.json({ ideas: parsed });
  } catch (err) {
    console.error("❌ Idea generator error:", err);
    res.status(500).json({ error: "Failed to generate ideas", details: err.message });
  }
});

// ---------- REPORT ANALYZER ----------
app.post("/api/report/analyze", async (req, res) => {
  try {
    const { reportText } = req.body;
    if (!reportText) return res.status(400).json({ error: "Report text is required" });

    const model = genAI.getGenerativeModel({ model: MODEL_NAME });
    const prompt = `
      Analyze the following project report and give structured feedback:
      "${reportText}"
      Respond in strict JSON:
      {
        "strengths": ["point1", "point2"],
        "weaknesses": ["point1", "point2"],
        "recommendations": ["point1", "point2"],
        "score": number
      }
    `;
    const result = await model.generateContent(prompt);
    let text = result.response.text().replace(/```json|```/g, "").trim();

    const parsed = JSON.parse(text);
    if (parsed.score === undefined) parsed.score = 75;
    res.json({ analysis: parsed });
  } catch (err) {
    console.error("❌ Report analyzer error:", err);
    res.status(500).json({ error: "Failed to analyze report", details: err.message });
  }
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
