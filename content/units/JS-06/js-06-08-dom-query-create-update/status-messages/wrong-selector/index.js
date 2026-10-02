// The selector looks for a class, but the area has an id: querySelector finds nothing and returns null.
const messages = document.querySelector(".messages");

function addMessage(text) {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  messages.append(paragraph);
}

function clearMessages() {
  for (const paragraph of messages.querySelectorAll("p")) {
    paragraph.remove();
  }
}

addMessage("%%saved%%");
addMessage("%%streak%%");
