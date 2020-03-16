# SnetX

一款透明代理(`transparent proxy`)工具[`snet`](https://github.com/monsterxx03/snet) 的 `MacOS`(`OS X`) 可视化界面

## 帮助文档

- 配置界面快捷搜索支持 设置项/Shadowsocks 配置搜搜/IP 检测/域名检测/快捷指令等
  ![search](./assets/2.png)

- 退出 `SnetX` 仅能通过 托盘(`Tray`) 中点击 `退出` 菜单, 使用 `Cmd+Q` 仅仅隐藏配置界面

- 如遇到无法访问网络, 请点击托盘的 `设置` 打开设置界面, 再点击 `停止重置` 按钮后, 查看是否网络正常

### 支持的快捷指令

- `h/help`: 打开帮助文档
- `IP`: 检测本机 IP 地址
- `password`: 设置 `sudo` 密码
- `init`: 初始化向导

### 网络不正常可能原因

- `SnetX` 崩溃
- [`snet`](https://github.com/monsterxx03/snet) 有端口冲突
- 启动多个`SnetX`
- SS 服务器无法访问
- 本身网络有异常

## 关于域名检测

用 `dig` 解析 IP, 查看 IP 是否为国内 IP, 是则显示直连
[原作者解释](https://github.com/monsterxx03/snet/issues/4#issuecomment-590224681)

## 问题反馈

如果是针对界面操作的问题, 请在此 repo 反馈, 如果是针对 [`snet`](https://github.com/monsterxx03/snet) 相关, 请前往 [`snet`](https://github.com/monsterxx03/snet) 反馈, 本项目仅仅是一个可视化界面

## 开机密码

- [`snet`](https://github.com/monsterxx03/snet) 运行本身需要 `sudo` 执行
- 停止 [`snet`](https://github.com/monsterxx03/snet) 采用的是 `kill`
- 密码存储使用 [keytar](https://github.com/atom/node-keytar)

## Thanks

- [snet](https://github.com/monsterxx03/snet)
- [angular-electron](https://github.com/maximegris/angular-electron)
- [SwitchHosts](https://github.com/oldj/SwitchHosts)
- [jsQR](https://github.com/cozmo/jsQR)
- [keytar](https://github.com/atom/node-keytar)
- 等等

## TODO

- [x] 二维码扫描
- [x] 退出后重新打开 "Attempting to call a function in a renderer window that has been closed or released."
- [x] cmd+q 拦截
- [ ] 菜单可快捷配置翻墙模式: 1.全局翻墙  2. 国内直连 3. 继承配置设置
- [ ] 更新 snet, 包含手动选择 snet 路径, 内置自动更新, 内置手动下载
- [ ] 打开设置页面 loading 动画处理
- [ ] 交互 loading 动画处理(ip 检测, 二维码扫描)
- [ ] 返回按钮统一处理
- [ ] speedtest
