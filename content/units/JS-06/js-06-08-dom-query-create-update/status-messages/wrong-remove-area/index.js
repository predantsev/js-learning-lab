const messages = document.querySelector("#messages");

function addMessage(text) {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  messages.append(paragraph);
}

// The whole area is removed: later messages are attached to a node that is no longer on the page.
function clearMessages() {
  messages.remove();
}

addMessage("%%saved%%");
addMessage("%%streak%%");
