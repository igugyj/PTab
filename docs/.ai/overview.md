# 项目概述

## 项目简介

PTab 是一个以本地视频为背景的沉浸式 Chrome 新标签页扩展。每次打开新标签页，都是一段属于自己的安静时刻。

## 核心功能

| 功能         | 描述                                         |
| ------------ | -------------------------------------------- |
| 全屏视频背景 | 上传本地视频作为背景，完全离线               |
| 实时时钟     | 大字 HH:MM + 秒数高亮，每秒更新，可在设置中开关 |
| 个性化设置   | 上传视频、开关时钟与日期、九宫格自定义时钟位置、调整遮罩深度、自定义主题色 |
| 轻量无依赖   | 设置存 localStorage，视频存 IndexedDB，不联网，无追踪 |

## 技术栈

| 技术         | 版本   | 用途                         |
| ------------ | ------ | ---------------------------- |
| React        | 19.2.0 | UI 组件与状态管理            |
| Vite         | 7.3.1  | 构建工具                     |
| CSS3         | -      | 样式（毛玻璃/动画/CSS 变量） |
| localStorage | -      | 设置持久化             |
| IndexedDB    | -      | 视频文件持久化                   |
| Chrome MV3   | -      | 扩展规范                     |

## 项目信息

- 项目名称: newtab-extension
- 扩展名称: PTab
- 版本: 1.0.0
- License: MIT
- 创建日期: 2024

## 环境要求

- Node.js 18+
- Google Chrome 88+ 或 Microsoft Edge 88+

## 快速开始

### 安装依赖

```bash
npm install
```

### 本地预览

```bash
npm run dev
# 访问 http://localhost:5173
```

### 构建扩展

```bash
# Chrome / Edge
npm run build:chrome
# 产物输出到 output/chrome/

# Firefox
npm run build:firefox
# 产物输出到 output/firefox/
```

### 加载到 Chrome

1. 打开 chrome://extensions/
2. 右上角开启开发者模式
3. 点击加载已解压的扩展程序
4. 选择项目的 `output/chrome/` 文件夹
5. 打开一个新标签页，完成！

## 目录结构

```
PTab/
├── docs/.ai/              # AI 开发文档（本目录）
├── assets/                # 仓库静态资源
├── public/
│   ├── manifest.json      # 扩展清单（MV3，Firefox 字段由 vite.config.js 注入）
│   ├── icon.png           # 扩展图标
├── src/
│   ├── components/
│   │   ├── VideoBackground.jsx
│   │   ├── Clock.jsx
│   │   └── SettingsPanel.jsx
│   ├── utils/
│   │   └── db.js          # IndexedDB 存取（视频文件）
│   ├── App.jsx            # 根组件
│   ├── App.css            # 全局样式
│   └── main.jsx           # 入口文件
├── .github/workflows/release.yml # Release 构建发布工作流
├── vite.config.js         # Vite 配置（含 Firefox manifest 注入插件）
└── package.json
```

构建产物：`output/chrome/`（Chrome/Edge）与 `output/firefox/`（Firefox），均已被 git 忽略。

## 默认配置

### 默认设置 (src/App.jsx)

```javascript
const DEFAULT_SETTINGS = {
  showClock: true,        // 时钟与日期整体显示开关
  clockPos: "mc",         // 时钟九宫格位置（tl/tc/tr/ml/mc/mr/bl/bc/br）
  overlayOpacity: 0.35,   // 遮罩透明度
  accentColor: "#f0c040", // 主题色
};
```

### App 组件初始化逻辑

- 从 localStorage 读取已保存设置，与 DEFAULT_SETTINGS 合并（缺失字段回落到默认值）
- 背景视频从 IndexedDB 异步读取，与设置相互独立

### localStorage Key

- newtab_settings - 存储用户设置（showClock、clockPos、overlayOpacity、accentColor）

## 关键特性说明

### 视频背景

- 支持 MP4 和 WebM 格式
- 自动循环播放，静音（Chrome 要求）
- 加载失败时保持深色兜底渐变背景
- 未上传视频时兜底背景使用系统色（Canvas），跟随浏览器当前亮/暗主题，文字同步改用系统前景色
- 可调整遮罩透明度（0-85%，仅在有视频时显示遮罩）

### 时钟显示与位置

- 设置面板中的 Clock and date 开关对应 settings.showClock（默认开启）
- 关闭时不渲染 Clock 组件：时间与日期同时隐藏，秒级刷新定时器一并停止
- 设置面板中的 Clock Position 九宫格对应 settings.clockPos（默认 mc 居中），取值 tl/tc/tr/ml/mc/mr/bl/bc/br，通过 .content.pos-* 类切换 flex 对齐实现定位

### 主题系统

- 使用 CSS 变量 --accent 传递主题色
- 预设 6 种主题色
- 支持自定义颜色选择器
- 主题色应用于秒数高亮、滑块、保存按钮等

### 响应式设计

- 使用 clamp() 实现响应式字号
- 时钟字号范围：4.5rem - 9rem
- 面板宽度：min(400px, 92vw)

## 预设配置

### 预设主题色 (src/components/SettingsPanel.jsx:16)

```javascript
const PRESET_COLORS = [
  "#f0c040",
  "#60d0f0",
  "#f08060",
  "#80e0a0",
  "#e080d0",
  "#ffffff",
];
```

## 视频上传功能说明

### 存储位置

- 通过 src/utils/db.js 存入 IndexedDB：数据库 ptab-videos，对象库 videos，固定键 uploaded_video

### 支持的视频格式

- .mp4
- .webm
- .ogg

### 使用方法

1. 打开设置面板，点击上传区域或直接拖拽视频文件
2. 视频立即存入 IndexedDB 并作为新标签页背景播放
3. 已上传视频可通过 Change 替换或 Remove 移除
