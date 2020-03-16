import { AfterViewChecked, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { ElectronRouterService } from '../../core/services/electron-router.service';
import { ElectronService } from '../../core/services/electron.service';
import { NotificationService } from '../../core/services/notification.service';

type ConfigMenu = { title: string; intro: string; icon: string } & (
  | { navigate?: string[] | { commands: string[]; extras: any }; action: Function }
  | { navigate: string[] | { commands: string[]; extras: any }; action?: Function }
);

interface ConfigMenus {
  type: 'config';
  menus: ConfigMenu[];
}

interface ConfigCommand {
  type: 'command';
  message: string;
  action: Function;
}

interface ConfigSS {
  type: 'ss';
  search: string;
  ssConfigs: any[];
}

interface ConfigDomainCheck {
  type: 'domain-check';
  message: string;
  value: string;
}

type ShowMenu = (ConfigMenus | ConfigCommand | ConfigSS | ConfigDomainCheck) & {
  menus?: any[];
  ssConfigs?: any[];
  message?: string;
};

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewChecked {
  public defaultMenus = [
    {
      title: 'sudo密码',
      intro: '配置sudo密码, 用于启动/停止软件',
      navigate: ['/password'],
      icon: 'fingerprint',
    },
    {
      title: 'ss配置',
      intro: 'shadowsocks列表, 可修改删除增加',
      navigate: ['/ss-list'],
      icon: 'build',
    },
    {
      title: '日志目录',
      intro: '打开日志目录文件夹',
      icon: 'insert_drive_file',
      action: async () => {
        this.notificationService.open('打开中, 请稍后...');
        await this.electronRouter.post('log:open');
      },
    },
    {
      title: '停止重置',
      intro: '清空路由规则DNS缓存. 出现无法访问国内网站, 可尝试此按钮',
      icon: 'clear_all',
      action: async () => {
        await this.electronRouter.post('snet:clear');
        this.notificationService.open('清空路由和DNS已执行');
      },
    },
    {
      title: 'IP检测',
      intro: '访问不同地区的IP服务, 检测本机IP地址',
      navigate: ['/ip-check'],
      icon: 'location_on',
    },
    {
      title: '域名检测',
      intro: '检测该域名解析的IP是否会为国内直连',
      navigate: ['/domain-check'],
      icon: 'domain',
    },
  ];

  public menus: ConfigMenu[] = [];

  public showMenu: ShowMenu;

  public ssConfigs: any[];

  @ViewChild('myInput')
  public myInput?: ElementRef<HTMLInputElement>;

  public searchValue = '';

  private searchLastValue = '';

  private commands = [
    {
      keys: ['h', 'help'],
      message: '查看帮助文档',
      action: () => {
        ElectronService.open('https://github.com/xinshangshangxin/snet-x');
      },
    },
    {
      keys: ['ip'],
      message: '检测本机IP地址',
      action: () => {
        this.router.navigate(['/ip-check']);
      },
    },
    {
      keys: ['password'],
      message: '设置 sudo 密码',
      action: () => {
        this.router.navigate(['/password']);
      },
    },
    {
      keys: ['stepper', 'init'],
      message: '初始化向导',
      action: () => {
        this.router.navigate(['/stepper']);
      },
    },
  ];

  constructor(
    private readonly router: Router,
    private readonly electronRouter: ElectronRouterService,
    private readonly notificationService: NotificationService
  ) {
    this.showMenu = {
      type: 'config',
      menus: this.defaultMenus.slice(0),
    };

    this.ssConfigs = [];

    this.searchAction('');
  }

  public async ngOnInit() {
    this.ssConfigs = await this.electronRouter.post('config:query');
  }

  public ngAfterViewChecked() {
    this.focus();
  }

  public menuAction(menuItem: ConfigMenu) {
    console.info('action: ', menuItem);
    if (menuItem.action) {
      menuItem.action();
    } else if (menuItem.navigate) {
      if (Array.isArray(menuItem.navigate)) {
        this.router.navigate(menuItem.navigate);
      } else {
        this.router.navigate(menuItem.navigate.commands, menuItem.navigate.extras);
      }
    }
  }

  public keyup(e: KeyboardEvent) {
    const search = (e.target as HTMLInputElement).value.trim();

    console.info('search: ', search, e.keyCode);

    if (e.keyCode !== 13 || this.searchLastValue !== search) {
      this.searchAction(search);
      this.searchLastValue = search;

      return;
    }

    this.enterAction(search);
    this.searchLastValue = search;
  }

  public enterAction(search: string) {
    if (!search) {
      this.resolveHelp().action();
      return;
    }

    console.info('this.showMenu: ', this.showMenu);

    switch (this.showMenu.type) {
      case 'config': {
        const [menuItem] = this.showMenu.menus;
        this.menuAction(menuItem);
        break;
      }
      case 'command':
        this.showMenu.action();
        break;
      case 'ss': {
        const [config] = this.showMenu.ssConfigs;
        // eslint-disable-next-line no-underscore-dangle
        this.router.navigate(['/ss-detail'], { queryParams: { configId: config._id } });
        break;
      }
      case 'domain-check': {
        const { value } = this.showMenu;
        this.router.navigate(['/domain-check'], { queryParams: { domain: value } });
        break;
      }
      default:
        break;
    }
  }

  public searchAction(search: string) {
    this.showMenu =
      this.resolveEmpty(search) ||
      this.resolveCommand(search) ||
      this.resolveConfig(search) ||
      this.resolveSSConfig(search) ||
      this.resolveDomain(search) ||
      this.resolveHelp();
  }

  private resolveEmpty(search: string): ConfigMenus | false {
    if (search) {
      return false;
    }

    return {
      type: 'config',
      menus: this.defaultMenus.slice(0),
    };
  }

  private resolveConfig(search: string): ConfigMenus | false {
    const value = search.toLocaleLowerCase();
    const list = this.defaultMenus.filter(({ title, intro }) => {
      return title.toLocaleLowerCase().includes(value) || intro.toLocaleLowerCase().includes(value);
    });

    if (!list.length) {
      return false;
    }

    return {
      type: 'config',
      menus: list,
    };
  }

  private resolveCommand(search: string): ConfigCommand | false {
    const value = search.toLocaleLowerCase();

    const match = this.commands.find(({ keys }) => {
      return keys.includes(value);
    });

    if (!match) {
      return false;
    }

    return {
      type: 'command',
      ...match,
    };
  }

  private resolveHelp() {
    return this.resolveCommand('h') as ConfigCommand;
  }

  private resolveSSConfig(search: string): ConfigSS | false {
    const list = this.ssConfigs.filter((item) => {
      return item.name.includes(search) || item['ss-host'].includes(search);
    });

    if (!list.length) {
      return false;
    }

    return {
      type: 'ss',
      search,
      ssConfigs: list,
    };
  }

  // eslint-disable-next-line class-methods-use-this
  private resolveDomain(search: string): ConfigDomainCheck | false {
    const reg = /^(https?:\/\/)?(([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,6})/;

    if (!reg.test(search)) {
      return false;
    }

    return {
      type: 'domain-check',
      message: `检测 ${search} 是否翻墙`,
      value: search,
    };
  }

  private focus() {
    setTimeout(() => {
      this.myInput?.nativeElement.focus();
    }, 500);
  }
}
