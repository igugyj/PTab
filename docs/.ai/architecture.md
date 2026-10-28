# 架构设计

## 整体架构

PTab 采用典型的 React 单页应用架构，以组件化方式构建。作为 Chrome 扩展，它通过 manifest.json 注册为新标签页覆盖。

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome 扩展层                          │
│              (manifest.json, Chrome API)                  │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   React 应用层                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   App.jsx    │──▶│  Components  │──▶│    CSS       │ │
│  │  (根组件)     │  │              │  │  (样式层)    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   构建工具层                               │
│              (Vite + 自定义插件)                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │  browser-manifest 插件 (注入 Firefox 字段)        │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   数据持久化层                             │
│                    (localStorage 设置 + IndexedDB 视频)   │
└───────────────────────────────────────────────────────────┘
```

## 组件层级结构

```
App (根组件)
├── VideoBackground (视频背景层)
│   ├── <video> 或 <div.video-fallback>
│   └── <div.video-overlay> (遮罩层)
├── Content (内容区，flex 居中)
│   └── Clock (时钟)
│   │   ├── .clock-time
│   │   │   ├── .clock-hm (HH:MM)
│   │   │   └── .clock-sec (秒数)
│   │   └── .clock-date (日期)
├── SettingsButton (设置按钮，右下角)
└── SettingsPanel (设置面板，条件渲染)
    ├── SettingsHeader (标题栏)
    ├── SettingsBody (内容区)
    │   ├── Video Upload (视频上传 - 点击或拖拽)
    │   ├── Clock Toggle (时钟与日期开关)
    │   ├── Opacity Slider (遮罩透明度)
    │   └── Color Picker (主题色)
    └── SettingsFooter (底部按钮)
```

## 数据流

### 设置状态流程

```
┌──────────────┐
│  localStorage│
│  (持久化)    │
└──────┬───────┘
       │ 1. 初始化读取
       ▼
┌──────────────────┐
│  App.state.settings│
│  (单一数据源)    │
└──────┬───────────┘
       │ 2. 向下传递
       ├───────────────────┬───────────────────┐
       ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│VideoBackground│  │SettingsPanel │  │   CSS 变量   │
│(src, opacity) │  │(编辑暂存)    │  │  (--accent)   │
└──────────────┘  └──────┬───────┘  └──────────────┘
                          │ 3. 提交修改
                          ▼
                   ┌──────────────┐
                   │  onChange()  │
                   │  (更新 state)│
                   └──────┬───────┘
                          │ 4. 自动保存
                          ▼
                   ┌──────────────┐
                   │  localStorage│
                   │  (useEffect) │
                   └──────────────┘
```

### 视频上传数据流

```
SettingsPanel（点击 / 拖拽选择文件）
    ↓ saveVideo(file)
src/utils/db.js —— 写入 IndexedDB（库 ptab-videos，键 uploaded_video）
    ↓ loadVideo()
App.jsx —— uploadedVideo state → URL.createObjectURL(blob)
    ↓ videoUrl prop
VideoBackground —— <video> 播放对象 URL
```

## 状态管理

### App 组件状态 (src/App.jsx)

| 状态         | 类型    | 说明                                                        |
| ------------ | ------- | ----------------------------------------------------------- |
| settings      | Object  | 用户设置（showClock, clockPos, overlayOpacity, accentColor） |
| uploadedVideo | Object  | IndexedDB 读出的已上传视频 {name, blob}，无则 null   |
| showSettings  | Boolean | 设置面板显示/隐藏状态                                |

### SettingsPanel 本地状态

| 状态  | 类型   | 说明                           |
| ----- | ------ | ------------------------------ |
| local     | Object  | 暂存用户修改，点击 Save 才提交 |
| uploading | Boolean | 文件上传中状态                 |
| dragging  | Boolean | 拖拽悬停状态                   |

## 关键设计模式

### 1. 受控组件 + 本地暂存

SettingsPanel 使用本地 state 暂存修改，避免实时更新导致的 UI 抖动，用户确认后才提交。

### 2. CSS 变量主题系统

通过 style={{ '--accent': settings.accentColor }} 将主题色注入根元素，所有子组件通过 var(--accent) 引用。

### 3. 条件渲染

SettingsPanel 仅在 showSettings === true 时渲染；Clock 仅在 settings.showClock 为 true 时渲染（关闭时同时隐藏时间与日期并停止秒级刷新）。

### 4. Effect 自动保存

useEffect(() => { localStorage.setItem(...) }, [settings]) 确保 settings 变化时自动持久化。

### 5. 构建时注入 Firefox 清单

vite.config.js 中的 browser-manifest 插件在 closeBundle 阶段改写 output/firefox/manifest.json，
注入 browser_specific_settings.gecko.id 与 chrome_settings_overrides.homepage。

## 层叠顺序 (z-index)

| 层级                   | z-index | 元素               |
| ---------------------- | ------- | ------------------ |
| 设置面板遮罩           | 50      | .settings-backdrop |
| 设置按钮               | 10      | .settings-btn      |
| 内容区（时钟）       | 1       | .content           |
| 视频背景               | 0       | .video-wrapper     |

## 事件流

### 打开设置面板

```
点击右下角设置按钮
    ↓
setShowSettings(true)
    ↓
渲染 SettingsPanel
    ↓
初始化 local state = settings
```

### 修改设置并保存

```
用户操作 UI
    ↓
update(key, value) → 更新 local state
    ↓
点击 Save
    ↓
onChange(local) → 更新 App.state.settings
    ↓
useEffect 触发 → 保存到 localStorage
    ↓
onClose() → setShowSettings(false)
```

### 上传视频

```
用户点击上传区域或拖拽文件
    ↓
handleFile / handleDrop → saveVideo(file) 写入 IndexedDB
    ↓
onUploadedChange() → App.refreshUploaded() → loadVideo()
    ↓
setUploadedVideo → 生成新的 videoUrl
    ↓
VideoBackground 收到新 src → effect 调用 videoRef.load()
    ↓
新视频开始播放
```

## 性能优化点

1. 条件渲染 - SettingsPanel 不显示时不渲染
2. 空依赖 useEffect - Clock 定时器只在挂载时设置一次
3. 本地暂存 - 避免频繁的父组件 state 更新
4. CSS 动画 - 使用 CSS transform 和 opacity 实现 GPU 加速动画
5. 按需渲染时钟 - showClock 关闭时不挂载 Clock，无秒级定时器

## 扩展点

### 可扩展功能位置

| 功能             | 文件位置                                        | 说明                     |
| ---------------- | ----------------------------------------------- | ------------------------ |
| 上传/替换视频    | SettingsPanel.jsx + utils/db.js                 | 经设置面板存入 IndexedDB |
| 添加设置项       | App.jsx 的 DEFAULT_SETTINGS + SettingsPanel.jsx | 添加新字段和 UI          |
| 修改主题色       | SettingsPanel.jsx 的 PRESET_COLORS              | 数组中追加颜色           |
| 构建与发布       | vite.config.js、.github/workflows/release.yml   | 输出目录与 Release 流程  |

## 构建配置

### 构建输出

- npm run build:chrome → output/chrome/（默认 mode）
- npm run build:firefox → output/firefox/（--mode firefox）

### Vite 插件

- browser-manifest（vite.config.js 内联插件）
  - 钩子：closeBundle
  - Firefox 构建时改写 output/firefox/manifest.json，注入 gecko.id、strict_min_version、chrome_settings_overrides.homepage
  - Chrome 构建不做任何修改
