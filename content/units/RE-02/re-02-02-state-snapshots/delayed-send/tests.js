const field = () => screen.byRole("textbox");
const sendButton = () => screen.byRole("button", { name: L.send });
const sentLines = () => logs().filter((line) => line.startsWith(L.sent));

test("the field is empty right after the click", async () => {
  await user.fill(field(), L.payBill);
  await user.click(sendButton());
  expect(field(), "the field right after the click").toHaveValue("");
});

test("nothing is printed before one second has passed", async () => {
  await sleep(1200); // lets the timer of the previous check finish first
  const before = sentLines().length;
  await user.fill(field(), L.waterPlants);
  await user.click(sendButton());
  await sleep(500);
  expect(sentLines().length - before, "new lines starting with “" + L.sent + "” half a second after the click").toBe(0);
});

test("one second later the text from the moment of the click is printed once", async () => {
  await sleep(1200); // lets the timers of the previous checks finish first
  const before = sentLines().length;
  await user.fill(field(), L.dentist);
  await user.click(sendButton());
  await user.type(field(), L.more);
  await sleep(1200);
  expect(sentLines().slice(before), "the new lines starting with “" + L.sent + "”").toEqual([L.sent + " " + L.dentist]);
});
