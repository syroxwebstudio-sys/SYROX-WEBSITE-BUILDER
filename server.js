const express = require("express");
const OpenAI = require("openai");
const cors = require("cors");

const app = express();

app.use(cors({
  origin: "https://syroxwebstudio-sys.github.io"
}));

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    name: "SYROX Web Studio API",
    status: "Online"
  });
});

app.post("/api/generate", async (req, res) => {
  try {
    const idea = req.body.idea;

    if (!idea || typeof idea !== "string") {
      return res.status(400).json({
        error: "Please enter a website idea."
      });
    }

    if (idea.length > 2000) {
      return res.status(400).json({
        error: "Idea is too long."
      });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({
        error: "AI service is not configured yet."
      });
    }

    const client = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: "https://api.groq.com/openai/v1"
    });

    const completion = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: "Create a complete, responsive HTML website based on the user's idea. Return only HTML code."
        },
        {
          role: "user",
          content: idea
        }
      ]
    });

    res.json({
      html: completion.choices[0].message.content
    });

  } catch (error) {
    console.error("Generation error:", error.message);
    res.status(500).json({
      error: "Website generation failed."
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`SYROX API running on port ${PORT}`);
});
