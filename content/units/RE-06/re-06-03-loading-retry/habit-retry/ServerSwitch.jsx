import { settings } from "./fixtureApi.js";

// Not part of the app: a control of the fake server, so you can make the next request fail.
export default function ServerSwitch() {
  function failNext() {
    settings.failNext = 1;
    console.log("server: the next request will fail");
  }

  return (
    <p>
      <button type="button" onClick={failNext}>
        %%failSwitch%%
      </button>
    </p>
  );
}
