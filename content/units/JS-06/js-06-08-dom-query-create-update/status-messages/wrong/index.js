const messages = document.querySelector("#messages");

// The text replaces whatever was in the area: there is only ever one message, and no <p>.
function addMessage(text) {
  messages.textContent = text;
}

function clearMessages() {
  messages.textContent = "";
}

addMessage("%%saved%%");
addMessage("%%streak%%");
