const amountMinor = 21050;
let size;
if (amountMinor > 50000) {
  size = "large";
} else if (amountMinor > 10000) {
  size = "medium";
} else {
  size = "small";
}

const priority = "high";
switch (priority) {
  case "high":
    console.log("high");
  case "normal":
    console.log("normal");
    break;
  case "low":
    console.log("low");
    break;
  default:
    console.log("unknown");
}
