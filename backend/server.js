require("dotenv").config();

const express = require("express");
const cors = require("cors");
const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json({ limit: "100kb" }));

if (!process.env.GEMINI_API_KEY) {
    console.error("GEMINI_API_KEY is missing!");
    process.exit(1);
}

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY
});

const MODEL = "gemini-2.5-flash";

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

        const response = await ai.models.generateContent({
            model: MODEL,
            contents: question.trim(),
            config: {
                systemInstruction:
                    "You are LEARNMATE AI, an expert educational tutor. " +
                    "Explain concepts in simple language with examples. " +
                    "Use step-by-step explanations and encourage learning."
            }
        });

        res.json({
            answer: response.text || "Please try again."
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

const PORT = 3000;
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

app.listen(PORT, () => {
    console.log("--------------------------------");
    console.log("LEARNMATE AI SERVER RUNNING");
    console.log("http://localhost:3000");
    console.log("--------------------------------");
});
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