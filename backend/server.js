const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "100kb" }));

const frontendDirectory = path.join(__dirname, "..");
app.get("/", (req, res) => {
    res.sendFile(path.join(frontendDirectory, "index.html"));
});
app.get("/index.html", (req, res) => {
    res.sendFile(path.join(frontendDirectory, "index.html"));
});
app.get("/app.js", (req, res) => {
    res.sendFile(path.join(frontendDirectory, "app.js"));
});
app.get("/style.css", (req, res) => {
    res.sendFile(path.join(frontendDirectory, "style.css"));
});

const ai = process.env.GEMINI_API_KEY
    ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
    : null;

if (!ai) {
    console.warn("GEMINI_API_KEY is missing. Add it to backend/.env to enable AI features.");
}

const MODEL = "gemini-3.8-flash";
const TUTOR_MODEL = "gemini-4-hydrogen";

// HOME
app.get("/", (req, res) => {
    res.json({
        message: "LEARNMATE AI backend is running!"
    });
});

// ======================================
// 1. REAL AI TUTOR
// ======================================

app.post("/api/chat", async (req, res) => {
    try {
        if (!ai) {
            return res.status(503).json({
                error: "AI is not configured. Add GEMINI_API_KEY to backend/.env and restart the server."
            });
        }

        const question = req.body.question;

        if (!question || typeof question !== "string" || !question.trim()) {
            return res.status(400).json({
                error: "Please enter a question."
            });
        }

        if (question.length > 2000) {
            return res.status(400).json({
                error: "Question is too long."
            });
        }

        const previousInteractionId = req.body.previousInteractionId;
        if (previousInteractionId !== undefined &&
            (typeof previousInteractionId !== "string" || previousInteractionId.length > 500)) {
            return res.status(400).json({
                error: "Invalid conversation state."
            });
        }

        const interaction = await ai.interactions.create({
            model: TUTOR_MODEL,
            input: question.trim(),
            ...(previousInteractionId
                ? { previous_interaction_id: previousInteractionId }
                : {}),
            system_instruction:
                "You are LEARNMATE AI, an expert educational tutor. " +
                "Explain concepts in simple language with examples. " +
                "Use step-by-step explanations and encourage learning."
        });

        res.json({
            answer: interaction.output_text || "Please try again.",
            interactionId: interaction.id
        });

    } catch (error) {
        console.error("Tutor error:", error.message);

        res.status(500).json({
            error: "AI Tutor failed to respond."
        });
    }
});

// ======================================
// 2. PERSONALIZED LEARNING MATERIALS
// ======================================

app.post("/api/recommendations", async (req, res) => {
    try {
        if (!ai) {
            return res.status(503).json({
                error: "AI is not configured. Add GEMINI_API_KEY to backend/.env and restart the server."
            });
        }

        const history = req.body.history;

        if (!Array.isArray(history) || history.length === 0) {
            return res.status(400).json({
                error: "Complete a quiz first to receive recommendations."
            });
        }

        // Keep only recent quiz results
        const recentHistory = history.slice(-15);

        // Calculate subject performance
        const subjectResults = {};

        recentHistory.forEach(quiz => {
            if (!quiz.subject || typeof quiz.percentage !== "number") {
                return;
            }

            if (!subjectResults[quiz.subject]) {
                subjectResults[quiz.subject] = {
                    total: 0,
                    count: 0
                };
            }

            subjectResults[quiz.subject].total += quiz.percentage;
            subjectResults[quiz.subject].count++;
        });

        const subjectSummary = Object.entries(subjectResults).map(
            ([subject, data]) => ({
                subject,
                average: Math.round(data.total / data.count)
            })
        );

        // Analyse weak topics
        const topicResults = {};

        recentHistory.forEach(quiz => {
            (quiz.answers || []).forEach(answer => {
                if (!answer.topic) return;

                if (!topicResults[answer.topic]) {
                    topicResults[answer.topic] = {
                        correct: 0,
                        total: 0
                    };
                }

                topicResults[answer.topic].total++;

                if (answer.correct) {
                    topicResults[answer.topic].correct++;
                }
            });
        });

        const topicSummary = Object.entries(topicResults).map(
            ([topic, data]) => ({
                topic,
                score: Math.round(
                    data.correct / data.total * 100
                )
            })
        );

        const prompt = `
You are LEARNMATE AI, an intelligent personalized learning system.

Analyse this student's actual quiz performance.

SUBJECT PERFORMANCE:
${JSON.stringify(subjectSummary)}

TOPIC PERFORMANCE:
${JSON.stringify(topicSummary)}

YOUR TASK:

1. Identify the weakest subjects.
2. Identify the weakest topics.
3. Prioritize topics scoring below 60%.
4. Generate simple study notes for the weak topics.
5. Give clear explanations with examples.
6. Create 3 practice questions with answers for each weak topic.
7. Recommend relevant educational video search topics.
8. Create a personalized 3-day study plan.
9. Explain why each recommendation is suitable based on performance.

FORMAT YOUR RESPONSE EXACTLY WITH THESE HEADINGS:

STUDENT PERFORMANCE ANALYSIS

WEAK TOPICS

PERSONALIZED STUDY NOTES

PRACTICE EXERCISES WITH ANSWERS

RECOMMENDED LEARNING VIDEOS

3-DAY PERSONALIZED LEARNING PLAN

IMPROVEMENT GOAL

IMPORTANT:
- Use the actual performance data.
- Never invent quiz scores.
- Avoid recommending topics the student has already mastered.
- If all topics are above 60%, recommend advanced practice instead.
- Make the material beginner-friendly and useful for engineering students.
`;

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: prompt
        });

        res.json({
            success: true,
            subjects: subjectSummary,
            topics: topicSummary,
            materials: response.text || "No materials generated."
        });

    } catch (error) {
        console.error("Recommendation error:", error.message);

        res.status(500).json({
            error: "Could not generate personalized learning materials."
        });
    }
});

// ======================================
// START SERVER
// ======================================

const PORT = process.env.PORT || 3000;
const users = new Map();
const sessions = new Map();

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, "sha512").toString("hex");
    return { salt, hash };
}

app.post("/api/auth/register", (req, res) => {
    const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";

    if (name.length < 2) {
        return res.status(400).json({ error: "Please enter your full name." });
    }
    if (!email.includes("@")) {
        return res.status(400).json({ error: "Please enter a valid email address." });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters." });
    }
    if (users.has(email)) {
        return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordData = hashPassword(password);
    const user = { id: crypto.randomUUID(), name, email };
    users.set(email, { ...user, password: passwordData });

    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, user);

    res.status(201).json({ token, user });
});

app.post("/api/auth/login", (req, res) => {
    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const account = users.get(email);

    if (!account) {
        return res.status(401).json({ error: "Email or password is incorrect." });
    }

    const passwordHash = hashPassword(password, account.password.salt).hash;
    if (!crypto.timingSafeEqual(Buffer.from(passwordHash, "hex"), Buffer.from(account.password.hash, "hex"))) {
        return res.status(401).json({ error: "Email or password is incorrect." });
    }

    const user = { id: account.id, name: account.name, email: account.email };
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, user);

    res.json({ token, user });
});

/* Legacy duplicate recommendation implementation is disabled. */
app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("LEARNMATE AI SERVER RUNNING");
    console.log("http://localhost:3000");
    console.log("--------------------------------");
});
/* Legacy duplicate route:
app.post("/api/recommendations", async (req, res) => {
    try {
        const history = req.body.history;

        if (!Array.isArray(history) || history.length === 0) {
            return res.status(400).json({
                error: "Complete a quiz before generating materials."
            });
        }

        // Calculate subject performance
        const subjects = {};

        history.forEach(quiz => {
            if (!subjects[quiz.subject]) {
                subjects[quiz.subject] = { total: 0, count: 0 };
            }

            subjects[quiz.subject].total += Number(quiz.percentage) || 0;
            subjects[quiz.subject].count++;
        });

        const subjectSummary = Object.entries(subjects).map(([subject, data]) => ({
            subject,
            score: Math.round(data.total / data.count)
        }));

        // Calculate performance for each topic within each subject
        const topicStats = {};

        history.forEach(quiz => {
            (quiz.answers || []).forEach(answer => {
                const key = `${quiz.subject} - ${answer.topic}`;

                if (!topicStats[key]) {
                    topicStats[key] = { correct: 0, total: 0 };
                }

                topicStats[key].total++;

                if (answer.correct) {
                    topicStats[key].correct++;
                }
            });
        });

        const topics = Object.entries(topicStats).map(([topic, data]) => ({
            topic,
            score: Math.round((data.correct / data.total) * 100),
            totalQuestions: data.total
        }));

        const prompt = `
You are LEARNMATE AI, an intelligent personalized learning assistant.

Analyze this student's REAL quiz performance.

SUBJECT PERFORMANCE:
${JSON.stringify(subjectSummary)}

TOPIC PERFORMANCE:
${JSON.stringify(topics)}

Generate a personalized learning report with these sections:

1. STUDENT PERFORMANCE ANALYSIS
Explain the student's actual performance.

2. WEAK TOPICS
Identify topics scoring below 60%.
Prioritize the weakest topics.

3. PERSONALIZED STUDY NOTES
Create simple, detailed notes for each weak topic.
Include definitions, explanations and examples.

4. PRACTICE EXERCISES
Create 3 questions for each weak topic.
Include answers and explanations.

5. RECOMMENDED VIDEO LESSONS
Suggest useful YouTube search terms for weak topics.

6. THREE-DAY STUDY PLAN
Create a realistic daily learning schedule.

7. IMPROVEMENT GOAL
Give the student a measurable target.

IMPORTANT:
- Base recommendations on the supplied scores.
- Never invent quiz results.
- Explain concepts in beginner-friendly language.
- If no topics are below 60%, recommend revision and more advanced practice.
- Do not claim that generated notes are taken from an official textbook.
`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        res.json({
            success: true,
            subjects,
            topics,
            materials: response.text || "No materials were generated."
        });

    } catch (error) {
        console.error("Recommendation error:", error.message);

        res.status(500).json({
            error: "Could not generate study materials. Please try again."
        });
    }
});
Legacy duplicate route end: */