// 1. What does this runtime offer? Check, then compare with the version table.
console.log("WeakRef:", typeof WeakRef);
console.log("FinalizationRegistry:", typeof FinalizationRegistry);
console.log("Symbol.dispose:", typeof Symbol.dispose);
try {
  new Function("{ using handle = null; }");
  console.log("%%parses%%");
} catch (error) {
  console.log("%%noParse%%", error.name);
}

// 2. A resource with a dispose method, used with `using`.
function openLog(name) {
  console.log("%%open%%", name);
  return {
    write(text) {
      console.log(name + ":", text);
    },
    [Symbol.dispose]() {
      console.log("%%close%%", name);
    },
  };
}

{
  using log = openLog("expenses");
  log.write("e-07");
}
console.log("%%after%%");
