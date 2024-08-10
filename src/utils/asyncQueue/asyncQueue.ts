import * as R from 'ramda';

import os from 'node:os';

const RUNNERS = (() => {
  const runners = R.range(0, Math.floor(os.cpus().length / 2));
  return runners.length === 0 ? [0] : runners;
})().map(n => n.toString());

export class AsyncQueue {
  private queue: (() => Promise<unknown>)[] = [];

  private runners: Record<string, Promise<unknown> | null>;

  constructor() {
    this.runners = Object.fromEntries(RUNNERS.map<[string, Promise<unknown> | null]>(key => [key, null]));
  }

  public push(fn: () => Promise<unknown>) {
    console.log('asyncQueue received fn');
    this.queue.push(fn);
    this.tryRun();
  }

  private tryRun() {
    if (this.queue.length === 0) return;

    console.log('queue not empty, trying to run');

    const openRunner = RUNNERS.find(key => this.runners[key] == null);
    console.log('openRunner', openRunner);

    if (R.isNotNil(openRunner)) {
      console.log('found open runner');
      const fn = this.queue.shift()!;
      const promise = fn();
      promise.finally(this.onFinish.bind(this, openRunner));
      this.runners[openRunner] = promise;
    } else {
      console.log('no open runners, awaiting');
    }
  }

  private onFinish(runnerKey: string) {
    console.log('onFinish');
    this.runners[runnerKey] = null;
    this.tryRun();
  }
}
