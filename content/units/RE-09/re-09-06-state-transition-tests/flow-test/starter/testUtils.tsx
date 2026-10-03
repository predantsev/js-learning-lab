// Test helpers: render the screen with a test API through the context, act like a person, read what is visible.
// Read-only. The checks of this exercise also put deliberately broken screens into `screenUnderTest`
// to see whether your test notices; your tests do not touch it.
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import type { ComponentType } from "react";
import { TaskScreen } from "./TaskScreen";
import { TasksApiContext } from "./tasksApi";
import type { TasksApi } from "./tasksApi";

export const screenUnderTest: { Component: ComponentType } = { Component: TaskScreen };

const nextTurn = () => new Promise((resolve) => setTimeout(resolve, 0));

export type View = {
  type(label: string, text: string): Promise<void>; // types into the field with this <label>
  press(name: string): Promise<void>; // clicks the button with this text
  alert(): string | null; // the text of role="alert", or null when there is none
  items(): string[]; // the texts of the list items
  waitFor(check: () => boolean): Promise<void>; // waits up to 1 s until check() is true
  unmount(): void;
};

export function renderWithApi(api: TasksApi): View {
  const container = document.createElement("div");
  document.body.append(container);
  const root = createRoot(container);
  const Screen = screenUnderTest.Component;
  // flushSync: the screen is on the page as soon as renderWithApi returns.
  flushSync(() =>
    root.render(
      <TasksApiContext value={api}>
        <Screen />
      </TasksApiContext>,
    ),
  );
  const field = (label: string) => {
    const tag = [...container.querySelectorAll("label")].find((item) => item.textContent?.trim() === label);
    const input = tag ? container.querySelector<HTMLInputElement>(`#${tag.htmlFor}`) : null;
    if (input === null) throw new Error(`%%noField%% "${label}"`);
    return input;
  };
  const button = (name: string) => {
    const found = [...container.querySelectorAll("button")].find((item) => item.textContent?.trim() === name);
    if (found === undefined) throw new Error(`%%noButton%% "${name}"`);
    return found;
  };
  return {
    async type(label, text) {
      await nextTurn();
      const input = field(label);
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, text);
      input.dispatchEvent(new Event("input", { bubbles: true }));
      await nextTurn();
    },
    async press(name) {
      await nextTurn();
      button(name).click();
      await nextTurn();
    },
    alert() {
      const region = container.querySelector('[role="alert"]');
      return region === null ? null : (region.querySelector("p")?.textContent ?? region.textContent ?? "").trim();
    },
    items() {
      return [...container.querySelectorAll("li")].map((item) => item.textContent?.trim() ?? "");
    },
    async waitFor(check) {
      for (let waited = 0; waited < 1000; waited += 10) {
        if (check()) return;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      throw new Error("%%waitTimeout%%");
    },
    unmount() {
      root.unmount();
      container.remove();
    },
  };
}
