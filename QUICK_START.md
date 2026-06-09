# 快速开始指南

## 1. 安装依赖

```bash
cd /Users/hetao/work/project/ai-agent-app
npm install
```

## 2. 开发模式运行

```bash
npm run dev
```

这会启动 Electron 应用，你将看到安装向导页面。

## 3. 项目结构说明

### 已实现的核心功能

#### ✅ 后端（主进程）

- **`src/main/setup/downloader.ts`** - 文件下载器
  - 支持进度回调
  - 支持断点续传
  - 支持取消下载

- **`src/main/setup/detector.ts`** - Agent 检测器
  - 检测 CLI 工具是否已安装
  - 获取版本信息

- **`src/main/setup/installer.ts`** - Agent 安装器
  - 自动下载二进制文件
  - 自动解压和安装
  - 设置执行权限
  - 添加到 PATH
  - 验证安装

- **`src/main/ipc/setup-handlers.ts`** - IPC 处理器
  - 暴露安装 API 给前端

#### ✅ 前端（渲染进程）

- **`src/renderer/pages/setup/SetupPage.tsx`** - 安装界面
  - 复选框选择 Agent
  - 实时进度显示
  - 三阶段 UI（选择 → 安装中 → 完成）
  - 错误处理和重试

#### ✅ 共享代码

- **`src/shared/config/agent-install-config.ts`** - Agent 配置
  - Claude Code
  - Codex
  - OpenClaw
  - Hermes

- **`src/shared/types/agent.ts`** - 类型定义

#### ✅ 预加载脚本

- **`src/preload/index.ts`** - 安全 API 桥接

## 4. 下一步工作

### 需要配置的内容

1. **更新下载 URL**
   编辑 `src/shared/config/agent-install-config.ts`，将示例 URL 替换为实际的下载地址：

```typescript
releases: {
  'darwin-arm64': 'https://your-cdn.com/agents/claude-code/v1.2.3/darwin-arm64',
  // ... 其他平台
}
```

2. **部署 CDN**
   - 方案 A：自建 CDN 托管二进制文件
   - 方案 B：使用 GitHub Release
   - 方案 C：使用 OSS（阿里云、腾讯云等）

### 待实现的功能

1. **对话页面** (`src/renderer/pages/chat/`)
   - Agent 选择器
   - 消息列表
   - 输入框
   - 工具调用显示

2. **API 网关配置** (`src/main/gateway/`)
   - 预设配置加密存储
   - 锁定机制
   - 隐藏调试入口

3. **会话管理** (`src/main/agent/`)
   - Agent 进程启动
   - ACP 协议通信
   - 消息收发

4. **设置页面** (`src/renderer/pages/settings/`)
   - Agent 管理
   - 网关配置（高级模式）
   - 主题切换

## 5. 测试

### 手动测试安装流程

1. 启动应用：`npm run dev`
2. 选择要安装的 Agent
3. 点击"安装已选"
4. 观察进度显示
5. 安装完成后点击"开始使用"

### 注意事项

⚠️ **当前下载 URL 是示例**，实际运行会失败。你需要：

1. 准备真实的 Agent 二进制文件
2. 上传到 CDN 或文件服务器
3. 更新 `agent-install-config.ts` 中的 URL

## 6. 构建和打包

### 构建应用

```bash
npm run build
```

### 打包为安装包

```bash
# macOS
npm run package:mac

# Windows
npm run package:win

# Linux
npm run package:linux
```

打包后的文件在 `release/` 目录。

## 7. 常见问题

### Q: 安装失败怎么办？
A: 检查：
1. 网络连接
2. 下载 URL 是否正确
3. 目标目录是否有写入权限
4. 防火墙或安全软件是否拦截

### Q: 如何添加新的 Agent？
A: 在 `agent-install-config.ts` 中添加配置：

```typescript
'new-agent': {
  name: 'New Agent',
  description: '描述',
  size: '40MB',
  recommended: false,
  releases: { /* ... */ },
  installPath: { /* ... */ }
}
```

然后在 `SetupPage.tsx` 的初始状态中添加。

### Q: 如何自定义安装路径？
A: 修改 `installPath` 配置：

```typescript
installPath: {
  darwin: '~/my-custom-path/agent',
  win32: '%USERPROFILE%\\MyAgents\\agent.exe',
  linux: '~/.myagents/agent'
}
```

## 8. 开发建议

1. **先测试检测功能**
   ```typescript
   const results = await window.api.setup.detectAgents();
   console.log(results);
   ```

2. **模拟安装测试**
   暂时注释掉实际下载代码，用本地文件测试安装流程

3. **日志调试**
   在关键位置添加 `console.log`，通过开发者工具查看

4. **错误处理**
   捕获所有异常并友好展示给用户

## 9. 参考文档

- **设计文档**：`/Users/hetao/work/project/AionUi/PLAN_AUTO_INSTALLER.md`
- **架构分析**：`/Users/hetao/work/project/AionUi/ARCHITECTURE_ANALYSIS.md`
- **完整方案**：`/Users/hetao/work/project/AionUi/PLAN_NEW_APP.md`

---

**项目创建时间**：2026-06-09  
**当前状态**：✅ 核心功能已实现，可开始开发测试
