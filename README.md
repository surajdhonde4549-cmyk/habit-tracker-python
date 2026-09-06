# ✦ Habit Tracker

A beautiful mobile-friendly **Habit + Sleep + Notes tracker** built with **Python (Flask)** backend.

## 📱 Features
- **Habits Tab** — Monthly calendar grid, mark daily completions, reorder, delete
- **Sleep Tracker** — Log sleep hours, color-coded table + bar chart (2027–2050)
- **Notes Tab** — Add notes with auto date/time stamp + images from gallery
- **Stats** — Total habits, completions, completion rate, day streak 🔥
- **Data saved** on server (JSON file) — persists across sessions

## 🚀 How to Run Locally

### Step 1 — Install Python
Download from https://python.org (Python 3.8+)

### Step 2 — Install dependencies
```bash
pip install -r requirements.txt
```

### Step 3 — Run the app
```bash
python app.py
```

### Step 4 — Open in browser
```
http://localhost:5000
```

## 📁 Project Structure
```
habit-tracker/
├── app.py              ← Flask server (Python)
├── requirements.txt    ← Python packages
├── README.md
├── data/
│   └── data.json       ← Auto-created, stores all your data
├── templates/
│   └── index.html      ← Main HTML page
└── static/
    ├── css/
    │   └── style.css   ← All styles
    └── js/
        └── app.js      ← All JavaScript
```

## 🌐 Deploy Online (Free)

### Option A — Railway.app
1. Push to GitHub
2. Go to https://railway.app
3. New Project → Deploy from GitHub → Select repo
4. Done! Free URL milega ✅

### Option B — Render.com
1. Push to GitHub
2. Go to https://render.com
3. New Web Service → Connect GitHub repo
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `python app.py`
6. Done! ✅

## 🔧 Tech Stack
- **Backend**: Python 3 + Flask
- **Frontend**: HTML5 + CSS3 + Vanilla JavaScript
- **Storage**: JSON file (server-side)
- **Design**: Dark theme, purple gradient, mobile-first

## 📊 Sleep Color Codes
| Color | Hours | Meaning |
|-------|-------|---------|
| 🟠 Orange | 0–4h | Low |
| 🔵 Blue | 4–7h | Normal |
| 🟢 Green | 7–9h | Good |
| 🟣 Purple | 9h+ | Great |
