LearnMate AI

1. Project Overview

LearnMate AI is an AI-powered learning assistant designed to help students learn through interactive tutoring. It provides a user-friendly interface with login functionality and AI-powered learning support using Google's Gemini AI.

2. Features

- User Login and Authentication
- AI-powered Gemini Tutor
- Interactive Learning Assistance
- Stateful Conversations
- User-friendly Interface
- Responsive Web Design

3. Technologies Used

Frontend

- HTML5
- CSS3
- JavaScript

Backend

- Node.js
- JavaScript

AI Integration

- Google Gemini API

4. Project Structure

learnmate-ai/
│
├── backend/
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
│
├── app.js
├── index.html
└── style.css

5. Installation and Setup

Prerequisites

- Node.js
- npm
- Git
- Google Gemini API key

Clone the Repository

git clone YOUR_GITHUB_REPOSITORY_URL

Navigate to the Project

cd learnmate-ai

Install Backend Dependencies

cd backend
npm install

Configure Environment Variables

Refer to ".env.example" and configure the required API key in your local ".env" file.

Never upload your actual API key to GitHub.

6. How to Run the Project

Navigate to the backend folder:

cd backend

Start the backend:

node server.js

Open the frontend using your browser or a local development server.

7. Dependencies

Backend dependencies are managed through:

- package.json
- package-lock.json

AI integration uses the Google Gemini API.

8. Future Improvements

- Personalized learning recommendations
- More interactive learning tools
- Improved conversation history
- Additional AI learning features
