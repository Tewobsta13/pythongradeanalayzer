
import os

from flask import Flask, render_template, request
from google import genai

api_key = os.environ.get("GEMINI_API_KEY")

if not api_key and os.path.exists(".env"):
    with open(".env", "r") as file:
        for line in file:
            line = line.strip()
            if line.startswith("GEMINI_API_KEY="):
                api_key = line.split("=", 1)[1].strip().strip('"').strip("'")
                break

if not api_key:
    raise RuntimeError("GEMINI_API_KEY is not configured.")

app = Flask(__name__)
client = genai.Client(api_key=api_key)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json(silent=True) or {}
        message = data.get("message", "").strip()

        if not message:
            return {"error": "Please enter a message."}, 400

        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=message
        )

        return {"response": response.text}

    except Exception as error:
        print(error)
        return {
            "error": "Something went wrong. Please try again."
        }, 500


if __name__ == "__main__":
    app.run(
        debug=False,
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000))
    )
