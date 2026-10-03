import { settings } from "./fakeServer.js";

// Not part of the app: a control of the fake server, so you can make the next change fail.
export default function ServerSwitch() {
  function failNext() {
    settings.failNext = 1;
    console.log("server: the next change will fail");
  }

  return (
    <p>
      <button type="button" onClick={failNext}>
        %%failSwitch%%
      </button>
    </p>
  );
}
