import { close } from './close';
import { createRouter } from './create-router';
import { instance } from './instance';
import { register } from './local-shortcut';
import { createWindow } from './window';

function showWindow() {
  let { win } = instance;

  if (win === null) {
    // 创建 BrowserWindow
    win = createWindow(true);
    instance.win = win;

    // 绑定事件
    win.on('show', showWindow);
    win.on('close', close);

    register(win);

    // 监听 electron 事件
    createRouter();
  } else if (win.isMinimized()) {
    win.restore();
  } else {
    win.show();
  }
}

export { showWindow };
