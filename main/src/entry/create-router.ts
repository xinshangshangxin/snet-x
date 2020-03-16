import { Router } from '../shared/ipc/router';
import { register } from './register-render-listener';
import { instance } from './instance';

function createRouter() {
  let { router } = instance;
  const { win } = instance;

  if (!win) {
    throw new Error('require browser win');
  }

  if (router) {
    router.destroy();
    router = null;
  }

  console.info('create electron router');
  instance.router = new Router(win.webContents);
  register();
}

export { createRouter };
