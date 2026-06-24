# AI Report Generator

An AI-powered web application that generates professional, structured reports from any topic or raw notes — powered by Google Gemini and Flask.

---

## Project Structure

```
ai-report-generator/
│
├── frontend/
│   ├── index.html          # Main UI
│   ├── css/style.css       # Styling
│   └── js/script.js        # Frontend logic
│
├── backend/
│   ├── app.py              # Flask entry point
│   ├── routes.py           # API routes
│   └── utils.py            # Gemini API integration & prompt builder
│
├── .env                    # Environment variables (API key)
├── requirements.txt        # Python dependencies
└── README.md
```

---

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/ai-report-generator.git
cd ai-report-generator
```

### 2. Get a Gemini API Key

- Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
- Create a new API key
- Copy it

### 3. Configure Environment

Edit the `.env` file in the project root:

```
GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Install Backend Dependencies

```bash
cd backend
pip install -r ../requirements.txt
```

### 5. Run the Backend

```bash
python app.py
```

The API will start at `http://localhost:5000`

### 6. Open the Frontend

Open `frontend/index.html` directly in your browser, or serve it with:

```bash
# Option A: Python simple server (from project root)
cd frontend
python -m http.server 3000
# Then open http://localhost:3000

# Option B: VS Code Live Server
# Right-click index.html → Open with Live Server
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/generate-report` | Generate a report |

### POST `/api/generate-report`

**Request Body:**
```json
{
  "topic": "Impact of AI on Healthcare",
  "notes": "Optional raw notes or data to include",
  "style": "business",
  "length": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "topic": "Impact of AI on Healthcare",
  "style": "business",
  "length": "medium",
  "report": "## Executive Summary\n..."
}
```

**Report Styles:** `business` | `academic` | `technical` | `journalistic` | `summary`

**Report Lengths:** `short` (~350 words) | `medium` (~800 words) | `long` (~1500 words)

---

## Features

- Input topic or paste raw notes/data
- 5 report styles: Business, Academic, Technical, Journalistic, Summary
- 3 length options: Short, Medium, Long
- Structured output: Executive Summary → Introduction → Body → Key Findings → Conclusion → Recommendations
- Copy to clipboard
- Download as .txt file
- Clean, responsive UI

---

## GitHub Workflow

```bash
# Work on dev branch
git checkout -b dev

# Make changes and commit regularly
git add .
git commit -m "feat: add report generation feature"
git push origin dev

# After testing, merge to main
git checkout main
git merge dev
git push origin main
```

---

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript (vanilla)
- **Backend:** Python + Flask
- **AI:** Google Gemini 2.0 Flash API
- **Libraries:** flask-cors, google-generativeai, python-dotenv
