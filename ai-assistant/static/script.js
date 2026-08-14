const messageInput = document.getElementById("message");
const askButton = document.getElementById("askButton");
const responseArea = document.getElementById("response");

askButton.addEventListener("click", async function () {
  const message = messageInput.value;

  responseArea.textContent = "Thinking...";

  try {
    const response = await fetch("/api/chat", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        message: message,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      responseArea.textContent = data.response;
    } else {
      responseArea.textContent = data.error;
    }
  } catch (error) {
    console.error(error);

    responseArea.textContent = "Unable to connect to the server.";
  }
});
