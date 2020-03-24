import { BrowserWindow, KeyboardEvent, Menu, MenuItem, nativeTheme, Tray } from 'electron';
import { map } from 'lodash';
import { resolve } from 'path';
import { Subject } from 'rxjs';

import { Errors } from '../shared/project/error';
import { listSnetConfig } from '../storage';
import { SnetConfig } from '../storage/interface';

enum MenuType {
  'normal' = 'normal',
  'separator' = 'separator',
  'submenu' = 'submenu',
  'checkbox' = 'checkbox',
  'radio' = 'radio',
}

export interface ClickData {
  menuItem: MenuItem;
  browserWindow: BrowserWindow;
  event: KeyboardEvent;
  type: MenuType;
  id?: string;
  config?: SnetConfig;
}

export interface ConfigClickData extends ClickData {
  config: SnetConfig;
}

class SnetTray {
  public tray: Tray;

  public contextMenu?: Menu;

  public menuClickSubject = new Subject<ClickData | ConfigClickData>();

  private trayImages = this.getTrayImage();

  constructor() {
    this.tray = new Tray(this.trayImages.stopped);
  }

  public async startup() {
    this.contextMenu = await this.buildMenu(false);
    this.tray.setContextMenu(this.contextMenu);
  }

  public changeStatus(status: 'start' | 'stop', configId?: string) {
    if (!this.contextMenu) {
      throw new Errors.NotStartupTray();
    }

    const startMenu = this.contextMenu.getMenuItemById('start');
    const stopMenu = this.contextMenu.getMenuItemById('stop');

    if (status === 'start') {
      startMenu.visible = false;
      stopMenu.visible = true;
      this.tray.setImage(this.trayImages.running);
    } else {
      startMenu.visible = true;
      stopMenu.visible = false;

      this.tray.setImage(this.trayImages.stopped);
    }

    if (configId) {
      const configMenu = this.contextMenu.getMenuItemById(configId);
      configMenu.checked = true;
    }
  }

  public async setPermission(valid: boolean) {
    this.contextMenu = await this.buildMenu(valid);
    this.tray.setContextMenu(this.contextMenu);
  }

  // eslint-disable-next-line class-methods-use-this
  private getTrayImage() {
    console.info('nativeTheme.shouldUseDarkColors: ', nativeTheme.shouldUseDarkColors);
    if (nativeTheme.shouldUseDarkColors) {
      return {
        running: resolve(__dirname, '../../assets/running-white.png'),
        stopped: resolve(__dirname, '../../assets/stopped-white.png'),
      };
    }

    return {
      running: resolve(__dirname, '../../assets/running-dark.png'),
      stopped: resolve(__dirname, '../../assets/stopped-dark.png'),
    };
  }

  private async buildMenu(permissionValid: boolean) {
    const configs = await listSnetConfig();

    const configList = map(configs, (config) => {
      return {
        label: config.name,
        type: MenuType.radio,
        id: config._id,
        config,
      };
    });

    const menuTemplate = [
      {
        label: '检查权限',
        type: MenuType.normal,
        id: 'permission',
      },
      {
        label: '启动',
        type: MenuType.normal,
        id: 'start',
      },
      { label: '停止', type: MenuType.normal, id: 'stop', visible: false },
      { type: MenuType.separator },
      ...configList,
      { type: MenuType.separator },
      {
        label: 'IP检测',
        type: MenuType.normal,
        id: 'ip',
      },
      {
        label: '域名检测',
        type: MenuType.normal,
        id: 'domain',
      },
      { type: MenuType.separator },
      {
        label: '日志目录',
        type: MenuType.normal,
        id: 'log',
      },
      {
        label: '存储目录',
        type: MenuType.normal,
        id: 'nedb',
      },
      {
        label: '设置',
        type: MenuType.normal,
        id: 'setting',
      },
      { type: MenuType.separator },
      { label: '退出', role: 'quit', type: MenuType.normal, id: 'quit' },
    ];

    const alwaysEnabledIds = ['ip', 'log', 'setting', 'quit'];

    return Menu.buildFromTemplate(
      menuTemplate.map((item: any) => {
        /* eslint-disable no-param-reassign */
        if (permissionValid) {
          if (item.id === 'permission') {
            item.visible = false;
          } else {
            item.enabled = true;
          }
        } else if (item.id === 'permission') {
          item.enabled = true;
        } else if (alwaysEnabledIds.includes(item.id)) {
          item.enabled = true;
        } else {
          item.enabled = false;
        }
        /* eslint-enable */

        if ((item as any).click) {
          return item;
        }

        return {
          ...item,
          click: (menuItem, browserWindow, event) => {
            this.menuClickSubject.next({
              menuItem,
              browserWindow,
              event,
              type: item.type,
              id: item.id,
              config: (item as any).config,
            });
          },
        };
      })
    );
  }
}

export { SnetTray };
