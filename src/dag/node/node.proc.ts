// prevents TS errors
declare const self: Worker;

const wait = async (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, Math.floor(Math.random() * ms));
  });

const startTime = Date.now();
await wait(5_000);
const endTime = Date.now();
const totalTime = endTime - startTime;

self.postMessage({ totalTime });

process.exit();
