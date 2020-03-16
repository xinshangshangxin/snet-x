import isDev from 'electron-is-dev';
import { resolve } from 'path';
import { format } from 'url';

const devUrl = 'http://localhost:4200';
const prodUrl = format({
  pathname: resolve(__dirname, '../../../render/index.html'),
  protocol: 'file:',
  slashes: true,
});

const loadUrl = isDev ? devUrl : prodUrl;

export { isDev, loadUrl };
