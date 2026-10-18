/* Tewobsta AI front end. Talks to Flask through POST /api/chat. */
(() => {
  "use strict";

  /* ---- Backend contract: change these if your Flask route uses other JSON keys ---- */
  const API_URL = "/api/chat";
  const REQUEST_KEYS = { message: "message", history: "history" }; // sent as { message, history }
  const RESPONSE_KEYS = ["reply", "response", "answer", "text"]; // first non-empty key is shown
  const MAX_HISTORY_TURNS = 20;

  /* ---- Elements (every id below exists in templates/index.html) ---- */
  const ids = [
    "chat-form",
    "message-input",
    "send-button",
    "form-error",
    "conversation",
    "empty-state",
    "new-chat-button",
  ];
  const el = {};
  for (const id of ids) {
    el[id] = document.getElementById(id);
    if (!el[id]) {
      console.error(`Tewobsta AI: missing element #${id}`);
      return;
    }
  }
  const app = document.querySelector(".app");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let history = []; // [{ role: 'user' | 'assistant', content }]
  let busy = false;
  let controller = null;

  /* ---- Small DOM helpers ---- */
  const make = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  /* ---- Safe, minimal markdown (builds DOM nodes, never injects HTML) ---- */
  function addInline(parent, text) {
    for (const part of text.split(/(`[^`\n]+`|\*\*[^*\n]+\*\*)/g)) {
      if (!part) continue;
      if (part.startsWith("`") && part.endsWith("`") && part.length > 2) {
        parent.append(make("code", "", part.slice(1, -1)));
      } else if (
        part.startsWith("**") &&
        part.endsWith("**") &&
        part.length > 4
      ) {
        parent.append(make("strong", "", part.slice(2, -2)));
      } else {
        parent.append(document.createTextNode(part));
      }
    }
  }

  const BULLET = /^\s*[-*•]\s+/;
  const NUMBERED = /^\s*\d+[.)]\s+/;
  const HEADING = /^(#{1,4})\s+(.*)$/;
  const startsBlock = (l) =>
    /^```/.test(l) || BULLET.test(l) || NUMBERED.test(l) || HEADING.test(l);

  function renderMarkdown(source) {
    const frag = document.createDocumentFragment();
    const lines = source.replace(/\r\n/g, "\n").split("\n");
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        i++;
        continue;
      }

      if (/^```/.test(line)) {
        const code = [];
        i++;
        while (i < lines.length && !/^```/.test(lines[i]))
          code.push(lines[i++]);
        i++;
        const pre = make("pre");
        pre.append(make("code", "", code.join("\n")));
        frag.append(pre);
        continue;
      }

      const heading = line.match(HEADING);
      if (heading) {
        const h = make("h" + Math.min(heading[1].length + 2, 6));
        addInline(h, heading[2]);
        frag.append(h);
        i++;
        continue;
      }

      if (BULLET.test(line) || NUMBERED.test(line)) {
        const ordered = NUMBERED.test(line);
        const list = make(ordered ? "ol" : "ul");
        const marker = ordered ? NUMBERED : BULLET;
        while (i < lines.length && marker.test(lines[i])) {
          const li = make("li");
          addInline(li, lines[i].replace(marker, ""));
          list.append(li);
          i++;
        }
        frag.append(list);
        continue;
      }

      const para = [line];
      i++;
      while (i < lines.length && lines[i].trim() && !startsBlock(lines[i]))
        para.push(lines[i++]);
      const p = make("p");
      addInline(p, para.join("\n"));
      frag.append(p);
    }
    return frag;
  }

  /* ---- Conversation rendering ---- */
  function scrollToLatest(node) {
    node.scrollIntoView({
      block: "nearest",
      behavior: reduceMotion.matches ? "auto" : "smooth",
    });
  }

  function addMessage(kind, text) {
    el["empty-state"].hidden = true;
    app.classList.add("has-messages");

    const row = make("div", `message message--${kind}`);
    const body = make("div", "message-body");
    const who = make(
      "span",
      "visually-hidden",
      kind === "user" ? "You said: " : "Tewobsta AI said: ",
    );

    if (kind === "ai") {
      row.append(make("span", "brand-mark"));
      row.firstChild.setAttribute("aria-hidden", "true");
      body.append(who, renderMarkdown(text));
    } else if (kind === "error") {
      body.textContent = text;
    } else {
      body.append(who, document.createTextNode(text));
    }
    row.append(body);
    el.conversation.append(row);
    scrollToLatest(row);
    return row;
  }

  function addTyping() {
    const row = make("div", "message message--ai");
    const mark = make("span", "brand-mark");
    mark.setAttribute("aria-hidden", "true");
    const body = make("div", "message-body");
    const dots = make("div", "typing");
    dots.innerHTML = "<span></span><span></span><span></span>"; // static markup only
    body.append(
      make("span", "visually-hidden", "Tewobsta AI is thinking"),
      dots,
    );
    row.append(mark, body);
    el.conversation.append(row);
    scrollToLatest(row);
    return row;
  }

  /* ---- Form state ---- */
  function showError(message) {
    el["form-error"].textContent = message;
    el["form-error"].hidden = false;
  }
  function clearError() {
    el["form-error"].textContent = "";
    el["form-error"].hidden = true;
  }
  function syncButton() {
    el["send-button"].disabled = busy || !el["message-input"].value.trim();
  }
  function autoGrow() {
    const box = el["message-input"];
    box.style.height = "auto";
    box.style.height = Math.min(box.scrollHeight, 168) + "px";
  }
  function setBusy(state) {
    busy = state;
    el["chat-form"].setAttribute("aria-busy", String(state));
    el["send-button"].querySelector(".send-label").textContent = state
      ? "Thinking…"
      : "Ask AI";
    syncButton();
  }

  /* ---- Sending ---- */
  function pickReply(data) {
    if (data && typeof data === "object") {
      for (const key of RESPONSE_KEYS) {
        if (typeof data[key] === "string" && data[key].trim()) return data[key];
      }
    }
    return "";
  }

  async function sendMessage(text) {
    clearError();
    setBusy(true);

    const payload = {
      [REQUEST_KEYS.message]: text,
      [REQUEST_KEYS.history]: history.slice(-MAX_HISTORY_TURNS * 2),
    };
    const userRow = addMessage("user", text);
    el["message-input"].value = "";
    autoGrow();
    const typingRow = addTyping();
    controller = new AbortController();

    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      let data = null;
      try {
        data = await res.json();
      } catch {
        /* non-JSON body */
      }

      if (!res.ok) {
        const detail = data && (data.error || data.message);
        throw new Error(
          typeof detail === "string" && detail
            ? detail
            : `The server returned an error (${res.status}). Try again in a moment.`,
        );
      }

      const reply = pickReply(data);
      if (!reply)
        throw new Error(
          "The server replied, but the answer was empty. Try rephrasing your question.",
        );

      typingRow.remove();
      history.push(
        { role: "user", content: text },
        { role: "assistant", content: reply },
      );
      addMessage("ai", reply);
    } catch (err) {
      if (err.name === "AbortError") return; // New chat pressed mid-request
      typingRow.remove();
      userRow.remove(); // Put the question back so nothing is lost
      el["message-input"].value = text;
      autoGrow();
      showError(
        err instanceof TypeError
          ? "Could not reach the server. Check that the Flask app is running, then try again."
          : err.message,
      );
      if (!el.conversation.querySelector(".message")) {
        el["empty-state"].hidden = false;
        app.classList.remove("has-messages");
      }
    } finally {
      controller = null;
      setBusy(false);
      el["message-input"].focus();
    }
  }

  /* ---- Events ---- */
  el["chat-form"].addEventListener("submit", (event) => {
    event.preventDefault();
    if (busy) return;
    const text = el["message-input"].value.trim();
    if (!text) {
      showError("Type a question first.");
      el["message-input"].focus();
      return;
    }
    sendMessage(text);
  });

  el["message-input"].addEventListener("input", () => {
    autoGrow();
    syncButton();
    clearError();
  });

  el["message-input"].addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      el["chat-form"].requestSubmit();
    }
  });

  el["new-chat-button"].addEventListener("click", () => {
    if (controller) controller.abort();
    history = [];
    el.conversation
      .querySelectorAll(".message")
      .forEach((node) => node.remove());
    el["empty-state"].hidden = false;
    app.classList.remove("has-messages");
    el["message-input"].value = "";
    autoGrow();
    clearError();
    setBusy(false);
    el["message-input"].focus();
  });

  autoGrow();
  syncButton();
})();
