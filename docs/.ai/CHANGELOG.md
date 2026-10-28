# 更新日志

## 2026-10-29

### 设置面板限高滚动与主题色背景
- .settings-panel 限定最大高度 min(640px, 86vh) 并改为 flex 纵向布局：标题栏与底部按钮固定，仅中间 .settings-body 在内容超出时滚动（flex:1 + min-height:0 + overflow-y:auto + overscroll-behavior: contain）
- 滚动条美化：scrollbar-width: thin + scrollbar-color（Firefox），::-webkit-scrollbar 系列 8px 圆角半透明滑块（Chromium/Edge），仅在内容溢出时出现
- 面板背景改用 Canvas 系统色跟随浏览器主题的主背景色，文字用 CanvasText；内部新增 --sp-* 语义色阶（均由 color-mix(in srgb, CanvasText ...) 派生），原硬编码的 rgba(255,255,255,*) 与 #fff 全部替换，明/暗主题下都可读
- 开关滑块改为 Canvas 底色，选中色块外框改为 CanvasText，拖拽高亮背景改用 var(--accent) 派生
- 删除结构错误的 output/firefox.zip（资源管理器右键压缩文件夹产生包裹目录，manifest 不在压缩包根导致临时加载报错；加载请直接选 output/firefox/manifest.json）

### README 新增安装下载章节
- 新增「安装下载」表格：Firefox 提供 addons.mozilla.org/addon/ptab 链接，Edge 留占位（上架后自行补充），Chrome 指向 GitHub Releases 的 ptab-chrome.zip
- 附各浏览器 zip 的安装方式说明（Release 产物由 release.yml 自动打包）

## 2026-10-28

### 设置：时钟显示开关
- App.jsx 的 DEFAULT_SETTINGS 新增 showClock（默认 true），设置面板新增 Clock and date 开关
- showClock 为 false 时不渲染 Clock 组件，时间与日期同时隐藏并停止每秒刷新
- App.css 新增 .settings-toggle 系列开关样式

### 移除时段问候
- 删除 src/components/Greeting.jsx 及 App.jsx 中的引用
- 删除 App.css 中的 .greeting 样式

### 构建产物目录调整
- vite.config.js 输出目录改为 output/chrome（默认）与 output/firefox（--mode firefox）
- eslint.config.js 忽略目录、.gitignore 同步加入 output
- README、overview.md 中的构建与加载路径同步更新

### 新增 Release 工作流
- 添加 .github/workflows/release.yml：推送 v* 标签时执行 lint、双浏览器构建，校验标签与 public/manifest.json 的 version 一致后创建 Release（附 ptab-chrome.zip、ptab-firefox.zip）；支持手动触发（仅上传构建产物）

### 修复与清理
- 修复 VideoBackground.jsx 中 effect 内同步 setState 导致的 react-hooks/set-state-in-effect 报错（改为渲染阶段按 props 调整 state），npm run lint 恢复通过
- 删除 App.css 中已无引用的 .settings-select、.settings-hint 死样式

### 更新文档
- README、overview.md、architecture.md、components.md 同步本次改动

### README 移除 Firefox 上架内容
- 删除“Firefox 签名指南”整节，以及临时加载说明中对该节的引用

### 大视频载入卡顿优化
- db.js 改为直接存取 File/Blob（IndexedDB 原生支持），不再 arrayBuffer() 把整个文件读进主线程内存；读取时兼容旧版 { data: ArrayBuffer } 记录
- App.jsx 改用 useMemo 生成视频对象 URL，此前每次渲染都会换 src 导致视频重新加载

### 扩大拖拽上传判定区域
- 拖拽事件从上传小框改挂到全屏遮罩 .settings-backdrop，打开设置后整个页面都可识别
- 增加 dragCounter 层级计数，修复子元素触发 dragleave 造成的高亮闪烁与判定提前失效

### 默认背景跟随浏览器主题
- html 启用 color-scheme: light dark，页面占位色与未上传视频时的兜底背景改用 Canvas 系统色，与当前 Firefox 亮/暗主题一致
- 未上传视频时（.app.no-video）文字、时钟大字、设置按钮改用 CanvasText 系统前景色，浅色主题下保持可读；此时不再渲染黑色遮罩
- 视频加载失败仍保持原深色兜底渐变（配合白色文字）

### 修复
- .gitattributes 第 48 行行内注释语法非法（git 每次都报 “is not a valid attribute name”），注释改为独立行

### 时钟与日期位置九宫格自定义
- DEFAULT_SETTINGS 新增 clockPos（默认 mc 居中，取值 tl/tc/tr/ml/mc/mr/bl/bc/br），随 localStorage 持久化
- 设置面板新增 Clock Position 九宫格：点击哪格（如左上），保存后时钟与日期即显示在对应位置；格内小横条位置与实际显示位置一致
- App.css 新增 .content.pos-* 与 .pos-cell 共用的九套对齐规则、.pos-grid/.pos-cell 选择器样式；左右列定位时日期行与大字同侧对齐，.content 增加内边距避免贴边
- README、overview.md、architecture.md、components.md 同步

## 2026-04-08

### 更新 README.md
- 更新项目徽章：React 19.2.0、Vite 7.3.1
- 更新项目结构：添加 video-list.generated.js、vite.config.js、vite-plugin-videoscan.js
- 更新功能列表：添加自动视频扫描功能
- 更新视频添加说明：改为自动扫描方式
- 更新自定义视频说明：移除手动编辑代码的要求
- 更新技术栈版本：React 19.2.0、Vite 7.3.1

### 更新所有文档
- overview.md：更新目录结构、默认设置、自动视频扫描说明
- architecture.md：更新关键设计模式、Vite 插件说明
- components.md：添加 App 组件导入说明、更新初始化逻辑、添加视频有效性检查、添加下拉框样式详细说明
- CHANGELOG.md：添加本次更新记录

### 优化下拉框样式
- 移除浏览器默认样式，使用自定义外观
- 添加 SVG 下拉箭头
- 增加内边距和圆角
- 添加毛玻璃效果
- 悬停效果：背景变亮、边框加深
- 聚焦效果：主题色边框、柔和光晕
- 平滑过渡动画

### 修复视频播放问题

- App.jsx 使用 PRESET_VIDEOS[0].value 作为默认视频
- 添加检查逻辑，确保保存的视频在可用列表中
- SettingsPanel 也添加了同样的检查
- 更新日志单独使用 CHANGELOG.md 文件

### 更新日志独立文件

- 创建 docs/.ai/CHANGELOG.md
- 从 index.md 中移除更新日志部分
- 在文档目录中添加 CHANGELOG.md 链接

### 修复视频自动扫描功能

- 改用生成真实文件的方式替代虚拟模块
- 创建 src/video-list.generated.js 自动生成文件
- 添加到 .gitignore 避免提交
- 更加稳定可靠

### 添加视频自动扫描功能

- 创建 vite-plugin-videoscan.js 插件
- 自动扫描 public/videos/ 目录
- 支持 .mp4、.webm、.ogg 格式
- 开发模式下监听目录变化自动刷新

### 优化 AI 开发文档

- 移除所有 emoji 样式
- 更适合 AI 阅读
- 更新相关文档说明

### 初始版本

- 创建 AI 开发文档框架
- 建立 docs/.ai 目录结构
- 创建 index.md 索引文件
- 生成高优先级文档（overview.md、architecture.md、components.md）
- 在 README.md 中添加 AI 开发文档链接
