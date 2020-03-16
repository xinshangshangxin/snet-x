import { exec } from './exec';

function normalizeHeader(str: string) {
  switch (str) {
    case 'Name': // for win32
    case 'COMM': // for darwin
      return 'COMMAND';
    case 'ParentProcessId':
      return 'PPID';
    case 'ProcessId':
      return 'PID';
    case 'Status':
      return 'STAT';
    default:
      return str;
  }
}

interface PSItem {
  COMMAND: string;
  PPID: string;
  PID: string;
  STAT: string;
}

async function psAll() {
  const { stdout } = await exec('ps -A -o ppid,pid,stat,comm');

  const lines = `${stdout}`
    .split(/[\r\n]/)
    .map((line) => {
      return line.trim();
    })
    .filter((line) => {
      return !!line;
    });

  const firstLine = lines.shift();

  if (!firstLine) {
    return [];
  }
  const headers = firstLine
    .trim()
    .split(/\s+/)
    .map(normalizeHeader);

  return lines
    .map((line) => {
      const matches = line.match(/([^\s]+(?=\s+))\s+([^\s]+(?=\s+))\s+([^\s]+(?=\s+))\s+(.*)/);

      if (!matches) {
        return null;
      }

      return headers.reduce((result, header, index) => {
        // eslint-disable-next-line no-param-reassign
        result[header as keyof PSItem] = matches[index + 1];
        return result;
      }, {} as PSItem);
    })
    .filter((item): item is PSItem => {
      return !!item;
    });
}

async function treeProcess(command: RegExp): Promise<PSItem[]>;
async function treeProcess(pid: number | string): Promise<PSItem[]>;
async function treeProcess(param: number | string | RegExp): Promise<PSItem[]> {
  const all = await psAll();
  const list = [];
  let process: PSItem | undefined;

  if (typeof param === 'object') {
    process = all.find(({ COMMAND }) => {
      return param.test(COMMAND);
    });
  } else {
    process = all.find(({ PID }) => {
      return `${param}` === PID;
    });
  }

  if (!process) {
    return [];
  }

  list.push(process);
  const cache = {
    [process.PID]: true,
  };

  all.forEach((psItem) => {
    const { PPID, PID } = psItem;
    if (cache[PPID]) {
      cache[PID] = true;
      list.push(psItem);
    }
  });

  return list;
}

async function treeProcessIds(param: number | string | RegExp): Promise<string[]> {
  const list = await treeProcess(param as any);

  return list.map(({ PID }) => {
    return PID;
  });
}

export { psAll, treeProcess, treeProcessIds };
