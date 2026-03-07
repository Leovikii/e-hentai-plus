import { CFG } from '../state/config';

type Task<T> = {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
};

class RequestQueue {
  private queue: Task<unknown>[] = [];
  private running = 0;

  enqueue<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({ execute: task, resolve, reject } as Task<unknown>);
      this.run();
    });
  }

  private run(): void {
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
