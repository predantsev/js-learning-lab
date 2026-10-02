const wish = {
  name: "%%lamp%%",
  label() {
    return "%%prefix%% " + this.name;
  },
  labelLater() {
    const inner = () => this.label();
    return inner();
  },
};
console.log(wish.label());
console.log(wish.labelLater());
const detached = wish.label;
try {
  detached();
} catch (error) {
  console.log(error.name);
}
