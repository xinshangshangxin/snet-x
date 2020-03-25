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
  proxyMode?: boolean;
}

export interface ConfigClickData extends ClickData {
  config: SnetConfig;
}

export interface ProxyModeClickData extends ClickData {
  proxyMode: true;
  id: 'bypassCN' | 'global' | 'inherit';
}

interface TrayStatus {
  configId?: string;
  proxyMode?: string;
  permissionValid?: boolean;
}

class SnetTray {
  public tray: Tray;

  public contextMenu?: Menu;

  public menuClickSubject = new Subject<ClickData | ConfigClickData | ProxyModeClickData>();

  private status: TrayStatus = {
    proxyMode: 'bypassCN',
  };

  private trayImages = this.getTrayImage();

  constructor() {
    this.tray = new Tray(this.trayImages.stopped);
  }

  public async startup({ configId, proxyMode }: TrayStatus = {}) {
    if (configId) {
      this.status.configId = configId;
    }

    if (proxyMode) {
      this.status.proxyMode = proxyMode;
    }

    this.rebuildMenu();
  }

  public async rebuildMenu() {
    this.contextMenu = await this.buildMenu();
    this.changePermission(this.status.permissionValid);

    this.tray.setContextMenu(this.contextMenu);
  }

  public changePermission(permissionValid = false) {
    if (!this.contextMenu) {
      throw new Errors.NotStartupTray();
    }

    this.status.permissionValid = permissionValid;

    /* eslint-disable no-param-reassign */
    const alwaysEnabledIds = ['log', 'nedb', 'setting', 'quit'];

    this.contextMenu.items.forEach((item) => {
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
    });
    /* eslint-enable */
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

  private addMenuClick(menuTemplate: any[]) {
    return menuTemplate.map((item: any) => {
      if ((item as any).click) {
        return item;
      }

      return {
        ...item,
        click: (menuItem: MenuItem, browserWindow: BrowserWindow, event: KeyboardEvent) => {
          this.menuClickSubject.next({
            menuItem,
            browserWindow,
            event,
            type: item.type,
            id: item.id,
            config: (item as any).config,
            proxyMode: (item as any).proxyMode,
          });
        },
      };
    });
  }

  private async buildMenu() {
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
      {
        label: '国内直连',
        type: MenuType.radio,
        id: 'bypassCN',
        proxyMode: true,
      },
      {
        label: '全局翻墙',
        type: MenuType.radio,
        id: 'global',
        proxyMode: true,
      },
      {
        label: '继承配置',
        type: MenuType.radio,
        id: 'inherit',
        proxyMode: true,
      },
      { type: MenuType.separator, start: 'config' },
      ...configList,
      { type: MenuType.separator, start: 'tools', end: 'config' },
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

    const menu = Menu.buildFromTemplate(this.addMenuClick(menuTemplate));

    if (this.status.configId) {
      const configMenu = menu.getMenuItemById(this.status.configId);

      if (configMenu) {
        configMenu.checked = true;
      }
    }

    if (this.status.proxyMode) {
      const configMenu = menu.getMenuItemById(this.status.proxyMode);

      if (configMenu) {
        configMenu.checked = true;
      }
    }

    return menu;
  }
}

export { SnetTray };
