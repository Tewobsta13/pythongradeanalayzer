import os

from flask import Flask, render_template, request
from google import genai

api_key = os.environ.get("GEMINI_API_KEY")

# Load .env as a local-development fallback.
if not api_key and os.path.exists(".env"):
    with open(".env", "r", encoding="utf-8") as file:
        for line in file:
            line = line.strip()

            if line.startswith("GEMINI_API_KEY="):
                api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                break

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not configured.")

app = Flask(__name__)
client = genai.Client(api_key=api_key)

MAX_MESSAGE_LENGTH = 5000
MAX_HISTORY_MESSAGES = 20


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return {"error": "Please send a valid message."}, 400

    message = data.get("message", "")

    if not isinstance(message, str) or not message.strip():
        return {"error": "Please enter a message."}, 400

    message = message.strip()

    if len(message) > MAX_MESSAGE_LENGTH:
        return {
            "error": f"Your message must be under {MAX_MESSAGE_LENGTH} characters."
        }, 400

    history = data.get("history", [])

    if not isinstance(history, list):
        history = []

    # Keep only valid, recent conversation messages.
    contents = []

    for item in history[-MAX_HISTORY_MESSAGES:]:
        if not isinstance(item, dict):
            continue

        role = item.get("role")
        text = item.get("text")

        if role not in ("user", "model"):
            continue

        if not isinstance(text, str) or not text.strip():
            continue

        if len(text) > MAX_MESSAGE_LENGTH:
            continue

        contents.append({
            "role": role,
            "parts": [{"text": text.strip()}],
        })

    contents.append({
        "role": "user",
        "parts": [{"text": message}],
    })

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=contents,
        )

        answer = response.text

        if not answer or not answer.strip():
            return {
                "error": "I couldn't generate a response. Please try again."
            }, 502

        return {"response": answer.strip()}

    except Exception:
        app.logger.exception("Gemini API request failed")

        return {
            "error": "I'm having trouble responding right now. Please try again."
        }, 500


if __name__ == "__main__":
    app.run(
        debug=False,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
    )
