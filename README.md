# AI Agent 助手

一个支持多 AI Agent 对话的桌面应用，支持 Claude Code、Codex、OpenClaw、Hermes 等多种 AI 工具。

## 功能特性

- ✅ **全自动安装**：一键安装 AI CLI 工具，无需手动配置
- ✅ **可选择安装**：用户可自由选择安装哪些 Agent
- ✅ **实时进度**：显示下载和安装进度
- ✅ **预配置网关**：内置 API 网关配置，开箱即用
- ✅ **多 Agent 对话**：支持与多个 AI Agent 同时对话
- ✅ **跨平台**：支持 macOS、Windows、Linux

## 开发

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发模式

```bash
npm run dev
```

### 构建

```bash
npm run build
```

### 打包

```bash
# macOS
npm run package:mac

# Windows
npm run package:win

# Linux
npm run package:linux
```

## 技术栈

- **框架**：Electron + React + TypeScript
- **UI 库**：Arco Design
- **构建工具**：electron-vite
- **打包工具**：electron-builder

## 项目结构

```
src/
├── main/           # 主进程
│   ├── setup/      # 安装相关逻辑
│   ├── ipc/        # IPC 处理器
│   └── index.ts    # 主进程入口
├── renderer/       # 渲染进程
│   ├── pages/      # 页面组件
│   └── index.tsx   # 渲染进程入口
├── preload/        # 预加载脚本
└── shared/         # 共享代码
    ├── types/      # 类型定义
    └── config/     # 配置文件
```

## 许可证

MIT
