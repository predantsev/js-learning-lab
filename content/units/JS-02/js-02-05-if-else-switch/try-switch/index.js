const task = { title: "%%library%%", priority: "high" };

switch (task.priority) {
  case "high":
    console.log(task.title, "—", "%%urgent%%");
    break;
  case "normal":
    console.log(task.title, "—", "%%normal%%");
    break;
  case "low":
    console.log(task.title, "—", "%%later%%");
    break;
  default:
    console.log(task.title, "—", "%%unknown%%");
}
