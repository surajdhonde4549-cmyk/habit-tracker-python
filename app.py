from flask import Flask, request, jsonify, render_template
import json
import os

app = Flask(__name__)

DATA_FILE = os.path.join('data', 'data.json')

# ── Ensure data file exists ──────────────────────────────────────
def load_data():
    if not os.path.exists(DATA_FILE):
        return {"habits": [], "sleep": {}, "notes": []}
    try:
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {"habits": [], "sleep": {}, "notes": []}

def save_data(data):
    os.makedirs('data', exist_ok=True)
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ── Routes ───────────────────────────────────────────────────────
@app.route('/')
def index():
    return render_template('index.html')

# ── Habits API ───────────────────────────────────────────────────
@app.route('/api/habits', methods=['GET'])
def get_habits():
    data = load_data()
    return jsonify(data.get('habits', []))

@app.route('/api/habits', methods=['POST'])
def save_habits():
    data = load_data()
    data['habits'] = request.json
    save_data(data)
    return jsonify({"status": "ok"})

# ── Sleep API ────────────────────────────────────────────────────
@app.route('/api/sleep', methods=['GET'])
def get_sleep():
    data = load_data()
    return jsonify(data.get('sleep', {}))

@app.route('/api/sleep', methods=['POST'])
def save_sleep():
    data = load_data()
    data['sleep'] = request.json
    save_data(data)
    return jsonify({"status": "ok"})

# ── Notes API ────────────────────────────────────────────────────
@app.route('/api/notes', methods=['GET'])
def get_notes():
    data = load_data()
    return jsonify(data.get('notes', []))

@app.route('/api/notes', methods=['POST'])
def save_notes():
    data = load_data()
    data['notes'] = request.json
    save_data(data)
    return jsonify({"status": "ok"})

# ── All data at once ─────────────────────────────────────────────
@app.route('/api/all', methods=['GET'])
def get_all():
    return jsonify(load_data())

@app.route('/api/all', methods=['POST'])
def save_all():
    data = request.json
    save_data(data)
    return jsonify({"status": "ok"})

# ── Run ──────────────────────────────────────────────────────────
if __name__ == '__main__':
    os.makedirs('data', exist_ok=True)
    app.run(debug=True, host='0.0.0.0', port=5000)
