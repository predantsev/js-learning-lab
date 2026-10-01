function makeReminder() {
  const prefix = "%%reminder%%";
  return (task) => prefix + task;
}

const remind = makeReminder();
console.log(remind("%%water%%"));
console.log(remind("%%books%%"));
