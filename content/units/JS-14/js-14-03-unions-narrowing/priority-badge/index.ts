type Priority = "low" | "normal" | "high";

function priorityBadge(priority: Priority): string {
  let badge = "";
  switch (priority) {
    case "high":
      badge = "!!!";
      break;
    case "normal":
      badge = "!";
      break;
    case "low":
      badge = "-";
      break;
    default: {
      const unhandled: never = priority;
      throw new Error(`Unknown priority: ${unhandled}`);
    }
  }
  return badge;
}

const tasks: { title: string; priority: Priority }[] = [
  { title: "%%books%%", priority: "high" },
  { title: "%%water%%", priority: "normal" },
  { title: "%%grandma%%", priority: "low" },
];

for (const task of tasks) {
  console.log(`[${priorityBadge(task.priority)}] ${task.title}`);
}
