const messages = document.querySelector("#messages");

// 1. addMessage(text): create a <p>, put the text into it and attach it to the end of the messages area.
function addMessage(text) {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  messages.append(paragraph);
}

// 2. clearMessages(): remove every message from the area, but keep the area itself.
function clearMessages() {
  for (const paragraph of messages.querySelectorAll("p")) {
    paragraph.remove();
  }
}

addMessage("%%saved%%");
addMessage("%%streak%%");
