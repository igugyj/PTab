# 组件文档

## 概述

本文档详细描述 PTab 项目中所有 React 组件的 API、Props 和实现细节。

---

## App 组件

文件: src/App.jsx

职责: 根组件，管理全局状态和布局

### Props

无

### State

| 状态          | 类型    | 默认值           | 说明                                       |
| ------------- | ------- | ---------------- | ------------------------------------------ |
| settings      | Object  | DEFAULT_SETTINGS | 用户设置（showClock, clockPos, overlayOpacity, accentColor） |
| uploadedVideo | Object  | null             | IndexedDB 读出的已上传视频 {name, blob}，无则 null |
| showSettings  | Boolean | false            | 设置面板显示状态                           |

### Imports

```javascript
import VideoBackground from "./components/VideoBackground";
import Clock from "./components/Clock";
import SettingsPanel from "./components/SettingsPanel";
import { loadVideo } from "./utils/db";
```

### DEFAULT_SETTINGS

```javascript
const DEFAULT_SETTINGS = {
  showClock: true,        // 时钟与日期整体显示开关
  clockPos: "mc",         // 时钟九宫格位置（tl/tc/tr/ml/mc/mr/bl/bc/br）
  overlayOpacity: 0.35,
  accentColor: "#f0c040",
};
```

### 主要逻辑

1. 初始化: 从 localStorage 读取设置并与 DEFAULT_SETTINGS 合并，解析失败则用默认值
2. 视频加载: 挂载时 loadVideo() 从 IndexedDB 读取，用 useMemo 生成对象 URL 交给 VideoBackground（只在视频本体变化时重建，普通重渲染不换 src），卸载时 revoke
3. 自动保存: useEffect 监听 settings 变化，自动保存到 localStorage
4. 主题注入: 通过 CSS 变量 --accent 传递主题色给子组件
5. 时钟开关: settings.showClock 为 false 时不渲染 Clock（时间与日期同时隐藏）
6. 时钟位置: settings.clockPos 决定 .content 的 pos-* 类，九宫格切换时钟与日期的显示位置（默认 mc 居中）

### 初始化 State 逻辑

```javascript
const [settings, setSettings] = useState(() => {
  try {
    const saved = localStorage.getItem("newtab_settings");
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
});
```

### 渲染结构

```jsx
<div className="app" style={{ "--accent": settings.accentColor }}>
  <VideoBackground src={videoUrl} overlayOpacity={settings.overlayOpacity} />
  <div className={`content pos-${settings.clockPos}`}>
    {settings.showClock && <Clock />}
  </div>
  <button
    className="settings-btn"
    onClick={() => setShowSettings(true)}
    title="Settings"
  >
    {/* 齿轮图标 */}
  </button>
  {showSettings && (
    <SettingsPanel
      settings={settings}
      uploadedVideo={uploadedVideo}
      onChange={handleChange}
      onUploadedChange={refreshUploaded}
      onClose={() => setShowSettings(false)}
    />
  )}
</div>
```

---

## VideoBackground 组件

文件: src/components/VideoBackground.jsx

职责: 全屏视频背景 + 遮罩层

### Props

| Prop           | 类型   | 必填 | 说明             |
| -------------- | ------ | ---- | ---------------- |
| src            | String 或 null | 否   | 视频对象 URL，null 时显示兜底背景 |
| overlayOpacity | Number | 是   | 遮罩透明度 (0-1) |

### State

| 状态     | 类型    | 默认值 | 说明             |
| -------- | ------- | ------ | ---------------- |
| hasError | Boolean | false  | 视频加载是否失败 |

### Refs

| Ref      | 类型             | 说明         |
| -------- | ---------------- | ------------ |
| videoRef | HTMLVideoElement | 视频元素引用 |

### 主要逻辑

1. src 变化时重新加载: useEffect 监听 src，调用 videoRef.current.load()
2. 错误处理: onError 回调设置 hasError = true，显示兜底背景
3. 错误重置: src 变化时在渲染阶段重置 prevSrc / hasError（React 官方的“props 变化时调整 state”模式），不要改回 effect 内同步 setState（会触发 react-hooks/set-state-in-effect 报错）
4. 遮罩按需渲染: 仅在有视频 src 时渲染 .video-overlay；未上传视频时让兜底背景直接呈现浏览器主题色

### 渲染结构

```jsx
<div className="video-wrapper">
  {src && !hasError ? (
    <video
      ref={videoRef}
      className="video-bg"
      autoPlay
      muted
      loop
      playsInline
      onError={() => setHasError(true)}
    >
      <source src={src} type="video/mp4" />
    </video>
  ) : (
    <div className="video-fallback" />
  )}
  {src && (
    <div
      className="video-overlay"
      style={{ background: `rgba(0, 0, 0, ${overlayOpacity})` }}
    />
  )}
</div>
```

### CSS 类

| 类名            | 说明                        |
| --------------- | --------------------------- |
| .video-wrapper  | 绝对定位全屏容器            |
| .video-bg       | 视频元素，object-fit: cover |
| .video-fallback | 兜底背景：加载失败为深色渐变，未上传时为系统主题色 |
| .video-overlay  | 黑色遮罩层                  |

---

## Clock 组件

文件: src/components/Clock.jsx

职责: 实时时钟显示（App 根据 settings.showClock 决定是否渲染本组件，关闭时时间与日期一并隐藏、秒级定时器不启动）

### Props

无

### State

| 状态 | 类型 | 默认值     | 说明     |
| ---- | ---- | ---------- | -------- |
| now  | Date | new Date() | 当前时间 |

### 工具函数

#### pad(n)

个位数前面补零

参数: n (Number) - 数字
返回: String - 补零后的字符串

示例:

```javascript
pad(9); // "09"
pad(12); // "12"
```

### 主要逻辑

1. 每秒更新: setInterval 每 1000ms 更新 now state
2. 清理定时器: useEffect cleanup 函数清除定时器，防止内存泄漏
3. 格式化:
   - hh:mm:ss - 使用 pad() 补零
   - 日期 - 使用 toLocaleDateString('en-US', options)

### 日期格式选项

```javascript
{
  weekday: 'long',    // "Wednesday"
  year:    'numeric', // "2026"
  month:   'long',    // "March"
  day:     'numeric', // "11"
}
```

### 渲染结构

```jsx
<div className="clock">
  <div className="clock-time">
    <span className="clock-hm">
      {hh}:{mm}
    </span>
    <span className="clock-sec">{ss}</span>
  </div>
  <div className="clock-date">{dateStr}</div>
</div>
```

### CSS 类

| 类名        | 说明                              |
| ----------- | --------------------------------- |
| .clock      | 时钟容器，user-select: none       |
| .clock-time | flex 容器，底部对齐               |
| .clock-hm   | 大字 HH:MM，Playfair Display 字体 |
| .clock-sec  | 小字秒数，使用 var(--accent)      |
| .clock-date | 日期行，大写，字间距加宽          |

---

## SettingsPanel 组件

文件: src/components/SettingsPanel.jsx

职责: 设置面板 UI，暂存用户修改

### Props

| Prop             | 类型     | 必填 | 说明                               |
| ---------------- | -------- | ---- | ---------------------------------- |
| settings         | Object   | 是   | 当前设置对象                       |
| uploadedVideo    | Object   | 否   | 已上传视频 {name, blob}，无则 null |
| onChange         | Function | 是   | 保存时的回调，接收新 settings 对象 |
| onUploadedChange | Function | 是   | 视频上传 / 删除后的刷新回调        |
| onClose          | Function | 是   | 关闭面板的回调                     |

### State

| 状态      | 类型    | 默认值      | 说明                 |
| --------- | ------- | ----------- | -------------------- |
| local     | Object  | {...settings} | 暂存修改的本地 state |
| uploading | Boolean | false       | 文件上传中状态       |
| dragging  | Boolean | false       | 拖拽悬停状态         |

### 初始化 State 逻辑

```javascript
const [local, setLocal] = useState({ ...settings });
```

### Imports

```javascript
import { useState, useRef } from "react";
import { saveVideo, deleteVideo } from "../utils/db";
```

视频通过 IndexedDB 持久化，见 src/utils/db.js。

### 常量

#### PRESET_COLORS

预设主题色列表

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

#### CLOCK_POSITIONS

时钟位置九宫格取值，顺序即 3x3 渲染顺序：

```javascript
const CLOCK_POSITIONS = ['tl', 'tc', 'tr', 'ml', 'mc', 'mr', 'bl', 'bc', 'br']
```

配套 POSITION_LABELS 为每个位置提供 title / aria-label 文案。

### 方法

#### update(key, value)

通用字段更新函数

参数:

- key (String) - 要更新的字段名
- value (Any) - 新值

实现:

```javascript
const update = (key, value) => setLocal((prev) => ({ ...prev, [key]: value }));
```

#### handleSave()

保存按钮点击处理

逻辑:

1. 调用 onChange(local) 提交修改
2. 调用 onClose() 关闭面板

#### handleBackdropClick(e)

遮罩背景点击处理

逻辑: 仅当点击目标是遮罩本身时才关闭（避免点击面板内容时误关闭）

#### handleFile(e)

文件选择回调: 取第一个文件，saveVideo() 写入 IndexedDB，调用 onUploadedChange() 刷新父组件，期间 uploading 为 true

#### handleDragEnter(e) / handleDragLeave(e) / handleDragOver(e)

拖拽悬停处理，事件挂在全屏遮罩上（整个页面都是判定区域）：dragCounter 计数抵消子元素进出触发的 enter/leave，归零才撤销高亮；仅对 Files 类型拖拽生效

#### handleDrop(e)

拖拽放下回调: 校验 video/* 类型后执行与 handleFile 相同的保存流程，并重置计数与高亮

#### handleRemove()

删除回调: deleteVideo() 后调用 onUploadedChange() 刷新父组件

### 渲染结构

```jsx
<div
  className="settings-backdrop"
  onClick={handleBackdropClick}
  onDragEnter={handleDragEnter}
  onDragLeave={handleDragLeave}
  onDragOver={handleDragOver}
  onDrop={handleDrop}
>
  <div className="settings-panel">
    <div className="settings-header">
      <h2>Settings</h2>
      <button className="settings-close" onClick={onClose}>
        ✕
      </button>
    </div>
    <div className="settings-body">
      {/* 视频上传 */}
      <section className="settings-section">
        <label className="settings-label">Background Video</label>
        {uploadedVideo ? (
          <div className="uploaded-info">
            <span className="uploaded-name">{uploadedVideo.name}</span>
            <div className="uploaded-actions">
              <button className="btn-upload" onClick={() => fileRef.current?.click()}>
                Change
              </button>
              <button className="btn-remove" onClick={handleRemove}>
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div
            className={`upload-zone${dragging ? " drag-over" : ""}`}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <span>Uploading…</span> : <span>Click or drag a video here</span>}
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="video/mp4,video/webm,video/ogg"
          hidden
          onChange={handleFile}
        />
      </section>
      {/* 时钟显示开关 */}
      <section className="settings-section">
        <label className="settings-label">Display</label>
        <div className="settings-toggle-row">
          <span className="settings-toggle-text">Clock and date</span>
          <button
            type="button"
            role="switch"
            aria-checked={local.showClock}
            className={`settings-toggle${local.showClock ? " on" : ""}`}
            onClick={() => update("showClock", !local.showClock)}
          >
            <span className="settings-toggle-knob" />
          </button>
        </div>
      </section>

      {/* 时钟位置九宫格 */}
      <section className="settings-section">
        <label className="settings-label">Clock Position</label>
        <div className="pos-grid">
          {CLOCK_POSITIONS.map((pos) => (
            <button
              key={pos}
              type="button"
              className={`pos-cell pos-${pos}${local.clockPos === pos ? " active" : ""}`}
              onClick={() => update("clockPos", pos)}
              title={POSITION_LABELS[pos]}
              aria-label={POSITION_LABELS[pos]}
              aria-pressed={local.clockPos === pos}
            />
          ))}
        </div>
      </section>
      {/* 遮罩透明度滑块 */}
      <section className="settings-section">
        <label className="settings-label">
          Overlay Opacity — {Math.round(local.overlayOpacity * 100)}%
        </label>
        <input
          type="range"
          className="settings-slider"
          min="0"
          max="0.85"
          step="0.05"
          value={local.overlayOpacity}
          onChange={(e) => update("overlayOpacity", parseFloat(e.target.value))}
        />
      </section>
      {/* 主题色选择 */}
      <section className="settings-section">
        <label className="settings-label">Accent Color</label>
        <div className="color-presets">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              className={`color-dot ${local.accentColor === c ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => update("accentColor", c)}
            />
          ))}
          <input
            type="color"
            className="color-picker"
            value={local.accentColor}
            onChange={(e) => update("accentColor", e.target.value)}
          />
        </div>
      </section>
    </div>
    <div className="settings-footer">
      <button className="btn-cancel" onClick={onClose}>
        Cancel
      </button>
      <button className="btn-save" onClick={handleSave}>
        Save
      </button>
    </div>
  </div>
</div>
```

### CSS 类

| 类名               | 说明                                  |
| ------------------ | ------------------------------------- |
| .settings-backdrop | 全屏半透明遮罩，backdrop-filter: blur |
| .settings-panel    | 面板主体：限高 min(640px, 86vh)、flex 纵向布局，背景 Canvas/文字 CanvasText 跟随浏览器主题，--sp-* 语义色阶由 CanvasText 派生 |
| .settings-header   | 标题栏，flex 两端对齐，flex-shrink: 0 固定不滚动 |
| .settings-body     | 内容区，flex 列布局；flex:1 + min-height:0 + overflow-y:auto，超出限高时出现细滚动条（scrollbar-width: thin + ::-webkit-scrollbar），overscroll-behavior: contain |
| .settings-section  | 单个设置项容器                        |
| .settings-label    | 设置项标签，大写，小字号              |
| .settings-toggle-row | 开关行，左右两端对齐               |
| .settings-toggle   | 显示开关按钮，开启时背景为 var(--accent) |
| .settings-toggle-knob | 开关滑块                        |
| .pos-grid        | 时钟位置九宫格容器（3x3）        |
| .pos-cell        | 九宫格格子，小横条位置即显示位置，选中态为 var(--accent) |
| .settings-slider   | 透明度滑块                            |
| .upload-zone       | 视频上传区（点击 / 拖拽）              |
| .uploaded-info     | 已上传视频信息条                      |
| .color-presets     | 颜色选择区容器                        |
| .color-dot         | 预设色块按钮                          |
| .color-picker      | 自定义颜色输入框                      |
| .settings-footer   | 底部按钮区，flex-shrink: 0 固定不滚动   |
| .btn-cancel        | 取消按钮                              |
| .btn-save          | 保存按钮，使用 var(--accent)          |
