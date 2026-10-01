const messages = document.querySelector("#messages");

// appendChild works like append for one node, and replaceChildren() with no arguments empties an element.
function addMessage(text) {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  messages.appendChild(paragraph);
}

function clearMessages() {
  messages.replaceChildren();
}

addMessage("%%saved%%");
addMessage("%%streak%%");
