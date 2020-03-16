// eslint-disable-next-line max-classes-per-file
export enum ERROR_MAP {
  OperationalError = 'OperationalError',
  SpawnError = 'spawn error',
  Timeout = 'Timeout',
  Unknown = 'Unknown',

  NoSnetPath = 'snet 路径未设置',
  NoSnetFound = 'snet 程序不存在',
  NoSnetConfigFound = 'snet 配置不存在',

  NoSudoPermission = '无sudo权限',

  NoHandleFound = '无相关处理函数',

  NotStartupTray = 'tray未初始化',

  DocTypeError = '文档类型错误',

  DomainCheckFailed = '域名检查失败',

  NotInit = '未初始化',

  QRCodeDecodeFailed = '二维码解析失败',
}

export interface ErrorJSON {
  type: 'error';
  message: string;
  code: keyof typeof ERROR_MAP;
  extra?: any;
  stack?: string;
}

export class OperationalError extends Error {
  public extra: any;

  public code: keyof typeof ERROR_MAP;

  constructor(extra?: object, message?: string, code: keyof typeof ERROR_MAP = 'OperationalError') {
    super();

    this.code = code;
    this.message = message || 'OperationalError';
    this.extra = extra;

    Object.setPrototypeOf(this, OperationalError.prototype);
  }

  public toJSON(): ErrorJSON {
    return {
      type: 'error',
      message: this.message,
      code: this.code,
      extra: this.extra,
      stack: this.stack,
    };
  }

  public toString() {
    return `${this.code}
${this.extra ? JSON.stringify(this.extra) : ''}
${this.stack || ''}`;
  }
}

export type ERRORS = { [name in keyof typeof ERROR_MAP]: typeof OperationalError };

function buildErrors(): ERRORS {
  const keys = Object.keys(ERROR_MAP) as [keyof typeof ERROR_MAP];
  const o = keys.reduce((result, code) => {
    const defaultMessage = ERROR_MAP[code];

    class ChildError extends OperationalError {
      constructor(extra?: object, message?: string) {
        super(extra, message || defaultMessage, code);

        Object.setPrototypeOf(this, ChildError.prototype);
      }
    }

    // eslint-disable-next-line no-param-reassign
    result[code] = ChildError;
    return result;
  }, {} as any);

  o.OperationalError = OperationalError;
  return o;
}

const Errors = buildErrors();

function try2error(obj: { [key: string]: any }) {
  if (obj && obj.type === 'error' && obj.code) {
    if (Errors[obj.code as keyof typeof ERROR_MAP]) {
      return new Errors[obj.code as keyof typeof ERROR_MAP](obj.extra);
    }

    return new Errors.Unknown(obj, obj.message);
  }

  return obj;
}

export { Errors, try2error };
