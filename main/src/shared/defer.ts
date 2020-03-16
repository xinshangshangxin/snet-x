export interface Deferred<T> {
  resolve: (value?: T | PromiseLike<T>) => void;
  reject: (err: Error) => void;
  promise: Promise<T>;
}

function defer<T>(): Deferred<T> {
  let resolve: any;
  let reject: any;
  const promise = new Promise<T>((re, rj) => {
    resolve = re;
    reject = rj;
  });

  return {
    resolve,
    reject,
    promise,
  };
}

export { defer };
