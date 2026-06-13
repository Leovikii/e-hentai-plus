import { CFG } from '../state/config';

type Task<T> = {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  priorityFn?: () => number;
};

class RequestQueue {
  private queue: Task<unknown>[] = [];
  private running = 0;
  private pausedUntil = 0;

  enqueue<T>(task: () => Promise<T>, priorityFn?: () => number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ execute: task, resolve, reject, priorityFn } as Task<unknown>);
      this.run();
    });
  }

  pauseGlobally(durationMs: number): void {
    const until = Date.now() + durationMs;
    if (until > this.pausedUntil) {
      this.pausedUntil = until;
    }
  }

  private run(): void {
    if (Date.now() < this.pausedUntil) {
      setTimeout(() => this.run(), this.pausedUntil - Date.now() + 10);
      return;
    }

    if (this.queue.length > 1) {
      this.queue.sort((a, b) => {
        const pa = a.priorityFn ? a.priorityFn() : 0;
        const pb = b.priorityFn ? b.priorityFn() : 0;
        return pb - pa;
      });
    }

    while (this.running < CFG.maxConcurrent && this.queue.length > 0) {
      const task = this.queue.shift()!;
      this.running++;

      const next = () => {
        this.running--;
        setTimeout(() => this.run(), CFG.requestSpacing);
      };

      task.execute()
        .then(value => { task.resolve(value); next(); })
        .catch(reason => { task.reject(reason); next(); });
    }
  }
}

export const requestQueue = new RequestQueue();
