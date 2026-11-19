
// ==========================================
// LEARNMATE AI - COMPLETE JAVASCRIPT
// ==========================================


// 1. QUIZ QUESTIONS
const quizData = {
    Python: [
        {
            topic: "Variables",
            question: "Which symbol is used to assign a value to a variable in Python?",
            options: ["==", "=", "!=", ":"],
            answer: "=",
            explanation: "The = operator assigns a value to a variable."
        },
        {
            topic: "Loops",
            question: "Which loop is used to iterate over a sequence?",
            options: ["if", "for", "switch", "break"],
            answer: "for",
            explanation: "A for loop iterates over items in a sequence."
        },
        {
            topic: "Functions",
            question: "Which keyword is used to define a function in Python?",
            options: ["function", "define", "def", "fun"],
            answer: "def",
            explanation: "Python uses the def keyword to define functions."
        }
    ],

    DBMS: [
        {
            topic: "SQL",
            question: "Which SQL command is used to retrieve data?",
            options: ["GET", "SELECT", "OPEN", "FETCH ALL"],
            answer: "SELECT",
            explanation: "SELECT retrieves data from a database."
        },
        {
            topic: "Keys",
            question: "Which key uniquely identifies each record in a table?",
            options: ["Foreign Key", "Primary Key", "Duplicate Key", "Common Key"],
            answer: "Primary Key",
            explanation: "A primary key uniquely identifies each row."
        },
        {
            topic: "Normalization",
            question: "What is the main purpose of normalization?",
            options: [
                "Increase duplication",
                "Reduce data redundancy",
                "Delete tables",
                "Increase storage"
            ],
            answer: "Reduce data redundancy",
            explanation: "Normalization organizes data to reduce redundancy."
        }
    ],

    "Operating Systems": [
        {
            topic: "Processes",
            question: "What is a program in execution called?",
            options: ["File", "Process", "Folder", "Compiler"],
            answer: "Process",
            explanation: "A process is a program currently being executed."
        },
        {
            topic: "Scheduling",
            question: "Which scheduling algorithm executes the shortest job first?",
            options: ["FCFS", "SJF", "Round Robin", "FIFO"],
            answer: "SJF",
            explanation: "SJF selects the process with the shortest burst time."
        },
        {
            topic: "Memory Management",
            question: "Which technique divides memory into fixed-size blocks?",
            options: ["Paging", "Scheduling", "Sorting", "Compilation"],
            answer: "Paging",
            explanation: "Paging divides memory into fixed-size pages and frames."
        }
    ]
};


// 2. APPLICATION STATE
let currentQuestions = [];
let currentQuestion = 0;
let score = 0;
let selectedAnswers = [];


// 3. STORAGE
function getQuizHistory() {
    try {
        return JSON.parse(localStorage.getItem("quizHistory")) || [];
    } catch (error) {
        return [];
    }
}

function saveQuizHistory(history) {
    localStorage.setItem("quizHistory", JSON.stringify(history));
}


// 4. SIDEBAR NAVIGATION
window.navigateTo = function(pageId) {
    const pages = document.querySelectorAll(".page");
    const buttons = document.querySelectorAll(".nav-btn");

    pages.forEach(page => {
        page.classList.remove("active");
    });

    buttons.forEach(button => {
        button.classList.remove("active");
    });

    const selectedPage = document.getElementById(pageId);

    if (selectedPage) {
        selectedPage.classList.add("active");
    }

    const selectedButton = document.querySelector(
        `.nav-btn[data-page="${pageId}"]`
    );

    if (selectedButton) {
        selectedButton.classList.add("active");
    }
};

document.querySelectorAll(".nav-btn").forEach(button => {
    button.addEventListener("click", function() {
        window.navigateTo(this.dataset.page);
    });
});


// 5. START QUIZ
const startButton = document.getElementById("startQuiz");

if (startButton) {
    startButton.addEventListener("click", startQuiz);
}

function startQuiz() {
    const subject = document.getElementById("subjectSelect").value;

    currentQuestions = quizData[subject] || [];
    currentQuestion = 0;
    score = 0;
    selectedAnswers = [];

    const quizArea = document.getElementById("quizArea");
    const quizResult = document.getElementById("quizResult");

    quizResult.innerHTML = "";
    quizArea.style.display = "block";

    if (currentQuestions.length === 0) {
        quizArea.innerHTML = "<p>No questions available.</p>";
        return;
    }

    showQuestion();
}


// 6. DISPLAY QUESTION
function showQuestion() {
    const quizArea = document.getElementById("quizArea");

    if (currentQuestion >= currentQuestions.length) {
        finishQuiz();
        return;
    }

    const question = currentQuestions[currentQuestion];

    quizArea.innerHTML = `
        <div class="quiz-question">
            <p class="question-count">
                Question ${currentQuestion + 1} of ${currentQuestions.length}
            </p>

            <h3>${question.question}</h3>

            <div class="quiz-options">
                ${question.options.map((option, index) => `
                    <button class="quiz-option" data-index="${index}">
                        ${option}
                    </button>
                `).join("")}
            </div>
        </div>
    `;

    quizArea.querySelectorAll(".quiz-option").forEach(button => {
        button.addEventListener("click", function() {
            selectAnswer(Number(this.dataset.index));
        });
    });
}


// 7. CHECK ANSWER
function selectAnswer(optionIndex) {
    const question = currentQuestions[currentQuestion];
    const chosenAnswer = question.options[optionIndex];

    selectedAnswers.push({
        topic: question.topic,
        correct: chosenAnswer === question.answer
    });

    if (chosenAnswer === question.answer) {
        score++;
    }

    currentQuestion++;
    showQuestion();
}


// 8. FINISH QUIZ
function finishQuiz() {
    const subject = document.getElementById("subjectSelect").value;
    const percentage = Math.round(
        (score / currentQuestions.length) * 100
    );

    const result = {
        subject: subject,
        score: score,
        total: currentQuestions.length,
        percentage: percentage,
        date: new Date().toLocaleDateString(),
        answers: selectedAnswers
    };

    const history = getQuizHistory();
    history.push(result);
    saveQuizHistory(history);

    document.getElementById("quizArea").innerHTML = "";

    document.getElementById("quizResult").innerHTML = `
        <div class="result-card">
            <h2>Quiz Completed!</h2>
            <h1>${percentage}%</h1>
            <p>You scored ${score} out of ${currentQuestions.length}</p>
            <p>${getPerformanceMessage(percentage)}</p>

            <button class="primary-btn" id="viewAnalytics">
                View Analytics
            </button>
        </div>
    `;

    document.getElementById("viewAnalytics").addEventListener("click", () => {
        updateLearningSystem();
        window.navigateTo("analytics");
    });

    updateLearningSystem();
}

function getPerformanceMessage(percentage) {
    if (percentage >= 80) return "Excellent work! Keep it up.";
    if (percentage >= 50) return "Good effort! Keep practising.";
    return "Let's focus on your weak topics and improve.";
}


// 9. ANALYZE STUDENT PERFORMANCE
function analyzePerformance() {
    const history = getQuizHistory();
    const topicResults = {};

    history.forEach(quiz => {
        (quiz.answers || []).forEach(answer => {
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

    const topics = Object.keys(topicResults).map(topic => {
        const data = topicResults[topic];

        return {
            topic: topic,
            percentage: Math.round(
                (data.correct / data.total) * 100
            ),
            total: data.total
        };
    });

    return topics;
}


// 10. GENERATE PERSONALIZED RECOMMENDATIONS
function displayRecommendations() {
    const recommendationsList = document.getElementById("recommendationsList");
    const weaknessList = document.getElementById("weaknessList");
    const dashboardRecommendations = document.getElementById("dashboardRecommendations");

    const topics = analyzePerformance();

    const weakTopics = topics.filter(topic => topic.percentage < 60);

    if (recommendationsList) {
        if (topics.length === 0) {
            recommendationsList.innerHTML =
                "<p>Take your first quiz to receive personalized recommendations.</p>";
        } else if (weakTopics.length === 0) {
            recommendationsList.innerHTML =
                "<p>Great work! No weak topics detected. Continue practising.</p>";
        } else {
            recommendationsList.innerHTML = weakTopics.map(topic => `
                <div class="recommendation-card">
                    <h3>${topic.topic}</h3>
                    <p>Current performance: ${topic.percentage}%</p>
                    <p>Recommended: Review notes and practise exercises.</p>
                </div>
            `).join("");
        }
    }

    if (weaknessList) {
        if (weakTopics.length === 0) {
            weaknessList.innerHTML = "<p>No weak topics detected yet.</p>";
        } else {
            weaknessList.innerHTML = weakTopics.map(topic => `
                <div class="topic-item">
                    <strong>${topic.topic}</strong>
                    <span>${topic.percentage}%</span>
                </div>
            `).join("");
        }
    }

    if (dashboardRecommendations) {
        dashboardRecommendations.innerHTML = weakTopics.length
            ? weakTopics.slice(0, 3).map(topic => `
                <div class="recommendation-card">
                    <h3>${topic.topic}</h3>
                    <p>Recommended for revision</p>
                </div>
            `).join("")
            : "<p>Take a quiz to get your learning recommendations.</p>";
    }
}


// 11. DISPLAY ANALYTICS
function displayPerformance() {
    const performanceList = document.getElementById("performanceList");
    const progressHistory = document.getElementById("progressHistory");

    const history = getQuizHistory();

    if (performanceList) {
        if (history.length === 0) {
            performanceList.innerHTML = "<p>No quiz results available yet.</p>";
        } else {
            performanceList.innerHTML = history.map(quiz => `
                <div class="topic-item">
                    <strong>${quiz.subject}</strong>
                    <span>${quiz.percentage}%</span>
                </div>
            `).join("");
        }
    }

    if (progressHistory) {
        if (history.length === 0) {
            progressHistory.innerHTML = "<p>Your progress will appear here after your first quiz.</p>";
        } else {
            progressHistory.innerHTML = history.map(quiz => `
                <div class="topic-item">
                    <div>
                        <strong>${quiz.subject}</strong>
                        <p>${quiz.date}</p>
                    </div>
                    <span>${quiz.score}/${quiz.total}</span>
                </div>
            `).join("");
        }
    }
}


// 12. UPDATE DASHBOARD
function updateDashboard() {
    const history = getQuizHistory();
    const averageScore = document.getElementById("averageScore");
    const topicsCompleted = document.getElementById("topicsCompleted");
    const weakTopicsCount = document.getElementById("weakTopicsCount");

    if (averageScore) {
        const average = history.length
            ? Math.round(
                history.reduce((sum, quiz) => sum + quiz.percentage, 0) /
                history.length
            )
            : 0;

        averageScore.textContent = average + "%";
    }

    if (topicsCompleted) {
        topicsCompleted.textContent = history.length;
    }

    if (weakTopicsCount) {
        const weakTopics = analyzePerformance().filter(
            topic => topic.percentage < 60
        );

        weakTopicsCount.textContent = weakTopics.length;
    }
}


// 13. UPDATE COMPLETE LEARNING SYSTEM
function updateLearningSystem() {
    updateDashboard();
    displayRecommendations();
    displayPerformance();
}


// 14. CONTENT LIBRARY
window.showResource = function(type) {
    const resourceContent = document.getElementById("resourceContent");

    if (!resourceContent) return;

    const resources = {
        notes: `
            <h2>Study Notes</h2>
            <p>Review your subject notes and important concepts.</p>
            <ul>
                <li>Python: Variables, loops and functions</li>
                <li>DBMS: SQL, keys and normalization</li>
                <li>Operating Systems: Processes, scheduling and paging</li>
            </ul>
        `,

        videos: `
            <h2>Video Learning</h2>
            <p>Use these topics to find educational video lessons.</p>
            <ul>
                <li>Python programming tutorials</li>
                <li>DBMS concepts for beginners</li>
                <li>Operating Systems tutorials</li>
            </ul>
        `,

        exercises: `
            <h2>Practice Exercises</h2>
            <p>Practise the topics where you need improvement.</p>
            <ul>
                <li>Write Python programs using loops</li>
                <li>Practise SQL queries</li>
                <li>Solve CPU scheduling problems</li>
            </ul>
        `
    };

    resourceContent.innerHTML =
        resources[type] || "<p>Resource not found.</p>";
};


// 15. INITIALIZE APPLICATION
document.addEventListener("DOMContentLoaded", function() {
    updateLearningSystem();
    window.navigateTo("dashboard");
});

// ==========================================
// LEARNMATE AI - TUTOR RESPONSE SYSTEM
// ==========================================



const tutorInput = document.getElementById("userQuestion");
const sendQuestionButton = document.getElementById("sendQuestion");
const chatMessages = document.getElementById("chatMessages");

async function sendTutorQuestion() {
    if (!tutorInput || !chatMessages) return;

    const question = tutorInput.value.trim();

    if (!question) return;

    addTutorMessage(question, "user");
    tutorInput.value = "";

    sendQuestionButton.disabled = true;
    sendQuestionButton.textContent = "Thinking...";

    const loadingMessage = addTutorMessage(
        "LEARNMATE AI is thinking...",
        "bot"
    );

    try {
        const response = await fetch("http://localhost:3000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ question })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Something went wrong.");
        }

        loadingMessage.textContent = data.answer;

    } catch (error) {
        loadingMessage.textContent =
            "Sorry, I couldn't connect to the AI Tutor. " + error.message;
    } finally {
        sendQuestionButton.disabled = false;
        sendQuestionButton.textContent = "Send";
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function addTutorMessage(message, sender) {
    const messageElement = document.createElement("div");

    messageElement.className =
        sender === "user" ? "user-message" : "bot-message";

    messageElement.textContent = message;

    chatMessages.appendChild(messageElement);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return messageElement;
}

if (sendQuestionButton && tutorInput) {
    sendQuestionButton.addEventListener("click", sendTutorQuestion);

    tutorInput.addEventListener("keydown", function(event) {
        if (event.key === "Enter") {
            sendTutorQuestion();
        }
    });
}

document.querySelectorAll(".suggestion").forEach(button => {
    button.addEventListener("click", function() {
        tutorInput.value = this.dataset.question;
        sendTutorQuestion();
    });
});
/* ======================================
   AUTOMATIC PERSONALIZED STUDY MATERIALS
====================================== */

async function generatePersonalizedMaterials() {

    const history = getQuizHistory();

    if (!history.length) {
        alert("Please complete a quiz first!");
        return;
    }

    const container = document.getElementById("aiGeneratedMaterials");

    if (!container) {
        alert("AI materials container is missing from HTML.");
        return;
    }

    container.textContent = "Gemini is analysing your performance and preparing study materials...";

    try {

        const response = await fetch(
            "http://localhost:3000/api/recommendations",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    history: history
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Unable to generate materials.");
        }

        container.innerHTML = "";

        const heading = document.createElement("h2");
        heading.textContent = "Your Personalized Learning Plan";

        const content = document.createElement("pre");
        content.textContent = data.materials;
        content.style.whiteSpace = "pre-wrap";
        content.style.overflowWrap = "anywhere";

        container.appendChild(heading);
        container.appendChild(content);

        // Add real YouTube search links for weak topics
        const videoHeading = document.createElement("h3");
        videoHeading.textContent = "Find Learning Videos";

        container.appendChild(videoHeading);

        const weakTopics = (data.topics || []).filter(
            topic => topic.score < 60
        );

        weakTopics.forEach(topic => {

            const link = document.createElement("a");

            link.href =
                "https://www.youtube.com/results?search_query=" +
                encodeURIComponent(topic.topic + " tutorial for students");

            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.textContent = "Watch lessons: " + topic.topic;

            container.appendChild(link);
            container.appendChild(document.createElement("br"));
        });

    } catch (error) {

        container.textContent =
            "Error generating materials: " + error.message;

    }
}
// Connect the AI materials button
document.addEventListener("DOMContentLoaded", function () {
    const button = document.getElementById("generateMaterialsBtn");

    if (button) {
        button.addEventListener("click", generatePersonalizedMaterials);
    }
});


