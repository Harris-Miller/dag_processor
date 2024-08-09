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
    this.queue.push(fn);
  }

  private tryRun() {
    if (this.queue.length === 0) return;

    const openRunner = RUNNERS.find(key => this.runners[key] != null);

    if (R.isNotNil(openRunner)) {
      const fn = this.queue.shift()!;
      const promise = fn();
      promise.finally(this.onFinish.bind(this, openRunner));
      this.runners[openRunner] = promise;
    }
  }

  private onFinish(runnerKey: string) {
    this.runners[runnerKey] = null;
    this.tryRun();
  }
}
