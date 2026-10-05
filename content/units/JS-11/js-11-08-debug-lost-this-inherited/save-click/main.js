const saveButton = document.querySelector("#save");
const status = document.querySelector("#status");

const notes = {
  heading: "%%notesTitle%%",
  saveCount: 0,
  save() {
    console.log("this is the button: " + (this === saveButton));
    this.saveCount += 1;
    status.textContent = this.heading + ": " + this.saveCount;
  },
};

saveButton.addEventListener("click", notes.save);
