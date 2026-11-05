// S1-L06 local teaching demo. No model API calls; not a complete homework solution.
{
console.log("实验 1：await 表达的是等待点");
const events = [];
async function handle(name) {
  events.push(name + ":start");
  await Promise.resolve();
  events.push(name + ":resume");
}
await Promise.all([handle("A"),handle("B")]);
console.log(events);
}
