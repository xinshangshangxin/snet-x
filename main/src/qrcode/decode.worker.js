/**
 * 此文件只会在dev环境下运行
 * prod 环境舍弃该文件, 使用 ts 转译后的 js 文件
 */
const path = require('path');
 
require('ts-node').register();
require(path.resolve(__dirname, './decode.worker.ts'));