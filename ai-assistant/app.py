import os

from flask import Flask, render_template, request
from google import genai


# Load the API key from .env
with open(".env", "r") as file:
    for line in file:
        line = line.strip()

        if line.startswith("GEMINI_API_KEY="):
            api_key = line.split("=", 1)[1]


# Create Flask app
app = Flask(__name__)


# Create Gemini client
client = genai.Client(api_key=api_key)


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/api/chat", methods=["POST"])
def chat():

    try:
        # Get JSON sent by JavaScript
        data = request.get_json()

        # Get and clean the user's message
        message = data["message"].strip()

        # Check if message is empty
        if not message:
            return {
                "error": "Please enter a message."
            }, 400

        # Send message to Gemini
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=message
        )

        # Get Gemini's response
        answer = response.text

        # Send response back to JavaScript
        return {
            "response": answer
        }

    except Exception as error:
        print(error)

        return {
            "error": "Something went wrong. Please try again."
        }, 500


if __name__ == "__main__":
    app.run(debug=True)