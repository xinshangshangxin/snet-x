import { compact } from 'lodash';

import { exec } from '../shell/exec';

interface Section {
  domain: string;
  type: string;
  ttl: string;
  class: string;
  value: string;
}

// 从 https://github.com/StephanGeorg/node-dig-dns 复制
function parseSection(values: string[], section: string): Section | string[] {
  if (section === 'answer' || section === 'additional') {
    return {
      domain: values[0],
      type: values[3],
      ttl: values[1],
      class: values[2],
      value: values[values.length - 1],
    };
  }
  return values;
}

function parse(output = '') {
  const regex = /(;; )([^\s]+)( SECTION:)/g;
  const result: {
    [key: string]: any;
  } = {};
  const data = output.split(/\r?\n/);
  let section = 'header';
  if (data.length < 6) {
    let msg = data[data.length - 2];
    if (!msg || msg.length <= 1) {
      msg = output;
    }
    throw new Error(msg);
  }

  data.forEach((line, i) => {
    let m;
    let changed = false;
    if (i && !line) {
      section = '';
    } else {
      do {
        m = regex.exec(line);
        if (m) {
          changed = true;
          section = m[2].toLowerCase();
        }
      } while (m);
    }
    if (section) {
      if (!result[section]) {
        result[section] = [];
      }
      if (!changed && line) {
        if (section === 'header') {
          result[section].push(parseSection(compact(line.split(/\t/)), section));
        } else {
          result[section].push(parseSection(compact(line.split(/\s+/g)), section));
        }
      }
    }
  });

  return {
    ...result,
    answer: result.answer as Section[],
    additional: result.additional as Section[],
    time: Number(data[data.length - 6].replace(';; Query time: ', '').replace(' msec', '')),
    server: data[data.length - 5].replace(';; SERVER: ', ''),
    datetime: data[data.length - 4].replace(';; WHEN: ', ''),
    size: Number(data[data.length - 3].replace(';; MSG SIZE  rcvd: ', '')),
  };
}

async function dig(cmd: string) {
  const { stdout } = await exec(cmd);
  return parse(stdout);
}

export { dig };
