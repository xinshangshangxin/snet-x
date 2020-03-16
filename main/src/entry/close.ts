import { instance } from './instance';

function close() {
  console.info('window close');

  const { win, redirectSubject } = instance;

  // render unsubscribe redirectSubject
  redirectSubject.next('destroy');

  // destroy close win
  setTimeout(() => {
    win?.destroy();
  }, 0);
}

export { close };
