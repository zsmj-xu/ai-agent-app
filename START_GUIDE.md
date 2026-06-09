# 项目启动指南

## 📦 安装依赖

依赖正在安装中... 请等待完成。

安装完成后，你将看到类似以下输出：
```
added 533 packages in 2m
```

## 🚀 启动应用

依赖安装完成后，在项目目录运行：

```bash
cd /Users/hetao/work/project/ai-agent-app
npm run dev
```

## 📱 首次使用流程

1. **应用启动**
   - Electron 窗口会自动打开
   - 显示安装向导页面

2. **安装 Agent**
   - 默认已勾选推荐的 3 个 Agent（Claude Code、Codex、Hermes）
   - 点击"安装已选 (3个)"按钮
   - 等待下载和安装完成

3. **开始对话**
   - 点击"开始使用"进入对话页面
   - 在顶部选择要使用的 Agent
   - 输入消息并发送

4. **配置管理**
   - 点击右上角"设置"按钮
   - 查看已安装的 Agent
   - 配置 API 网关（需要先解锁）

## 🔧 开发者工具

应用启动后会自动打开 DevTools（开发者工具），你可以：
- 查看控制台日志
- 调试网络请求
- 检查 React 组件

## ⚠️ 常见问题

### Q: 安装失败怎么办？
A: 
- 检查网络连接
- GitHub Release 下载地址可能需要代理
- 查看错误日志并重试

### Q: Agent 无法启动？
A: 
- 确保 Agent 已正确安装
- 检查安装路径和权限
- 查看主进程日志（终端输出）

### Q: 如何配置 API 网关？
A:
1. 进入设置 → 关于
2. 连续点击"版本 0.1.0"五次
3. 查看弹出的调试密码
4. 进入网关配置，输入密码解锁
5. 修改 Base URL 和 API Key

## 📝 配置 API 网关

编辑 `src/shared/config/gateway-config.ts`：

```typescript
export const DEFAULT_GATEWAY_CONFIG: GatewayConfig = {
  name: 'Default Gateway',
  baseUrl: 'https://your-newapi-url.com/v1', // 改为你的 NewAPI 地址
  apiKey: 'your-api-key-here', // 改为你的 API Key
  models: {
    'claude-code': 'claude-3-5-sonnet-20241022',
    'codex': 'gpt-4-turbo',
    'openclaw': 'gpt-4o',
    'hermes': 'mistral-large',
  },
};
```

修改后重新构建：
```bash
npm run build
npm run dev
```

## 🎯 下一步

等待 npm install 完成后：
1. 运行 `npm run dev`
2. 开始测试应用
3. 根据需要调整配置

祝你使用愉快！ 🎉
