# PTab

> 以本地视频为背景的沉浸式新标签页扩展（支持 Chrome / Edge / Firefox）

**AI 开发文档**: [docs/.ai/index.md](docs/.ai/index.md)

>[!NOTE]
> 本项目90%以上代码由AI生成

![Manifest](https://img.shields.io/badge/Manifest-V3-blue)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-7-646cff?logo=vite)
![License](https://img.shields.io/badge/License-MIT-green)

每次打开新标签页，都是一段属于自己的安静时刻。

---

## 功能

- **全屏视频背景** — 通过设置面板上传本地视频，完全离线，无需联网
- **实时时钟** — 大字 HH:MM + 秒数高亮，每秒更新
- **智能问候语** — 根据时段（清晨 / 上午 / 下午 / 傍晚 / 深夜）随机显示
- **个性化设置** — 上传视频、调整遮罩深度、自定义主题色
- **轻量无依赖** — 数据存 localStorage + IndexedDB，不联网，无追踪

---

## 预览

![预览截图](assets/image.png)

---

## 项目结构

```
PTab/
├── assets/                    # 仓库静态资源
├── public/
│   ├── manifest.json          # 扩展配置（MV3）
│   └── icon.png               # 扩展图标
├── src/
│   ├── components/
│   │   ├── VideoBackground.jsx  # 全屏视频 + 遮罩
│   │   ├── Clock.jsx            # 实时时钟
│   │   ├── Greeting.jsx         # 按时段问候语
│   │   └── SettingsPanel.jsx    # 设置面板（含上传）
│   ├── utils/
│   │   └── db.js                # IndexedDB 存储
│   ├── App.jsx                  # 根组件 / 状态管理
│   ├── App.css                  # 全局样式
│   └── main.jsx                 # 入口文件
├── vite.config.js               # Vite 配置
└── index.html
```

---

## 快速开始

### 环境要求

- Node.js 18+
- Google Chrome 88+ / Microsoft Edge 88+ / Firefox 109+

### 1. 安装依赖

```bash
npm install
```

### 2. 本地预览

```bash
npm run dev
# 访问 http://localhost:5173
```

### 3. 构建扩展

```bash
# Chrome / Edge
npm run build:chrome
# 产物输出到 dist/

# Firefox
npm run build:firefox
# 产物输出到 dist-firefox/
```

### 4. 加载到浏览器

**Chrome / Edge:**
1. 打开 `chrome://extensions/`（或 `edge://extensions/`）
2. 右上角开启 **开发者模式**
3. 点击 **加载已解压的扩展程序**
4. 选择 `dist/` 文件夹

**Firefox（临时加载，开发用）:**
1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击 **加载临时附加组件**
3. 选择 `dist-firefox/manifest.json`

> 临时加载在 Firefox 重启后会失效。要永久安装，需对扩展签名（见下方 Firefox 签名指南）。

---

## Firefox 签名指南

未签名的扩展无法在 Firefox 中永久安装，需要提交到 AMO (addons.mozilla.org) 签名。

### 1. 获取 Add-on ID

`gecko.id` 是 Firefox 扩展的唯一标识符，格式为 `名称@域名`。

- 如果你有自己的域名：`ptab@你的域名.com`
- 如果没有：使用你的邮箱 `ptab@你的邮箱.com`
- 或者在 AMO 创建扩展后，使用 AMO 分配的 ID

目前 manifest 中的默认值为 `ptab@example.com`，**上架前请修改为你自己的 ID**。

修改位置：`public/manifest.json` → `browser_specific_settings.gecko.id`

### 2. 获取 API 凭证

1. 访问 [addons.mozilla.org](https://addons.mozilla.org/) 注册/登录
2. 进入 [开发者中心 → API 密钥](https://addons.mozilla.org/developers/addon/api/key/)
3. 生成 API Key（JWT issuer）和 API Secret（JWT secret）

### 3. 安装 web-ext 并签名

```bash
npm install -D web-ext

$env:WEB_EXT_API_KEY="user:12345678"     # 替换为你的 API Key
$env:WEB_EXT_API_SECRET="your-secret"     # 替换为你的 API Secret
npx web-ext sign --source-dir dist-firefox
```

签名成功后会在当前目录生成 `.xpi` 文件，双击即可永久安装到 Firefox。

> 也可将扩展直接上传到 [AMO 开发者中心](https://addons.mozilla.org/developers/) 手动签名后再下载 `.xpi`。

---

## 自定义

### 上传视频

打开设置面板 → 点击上传区域或拖拽视频文件到区域中 → 自动存储。支持 `.mp4`、`.webm`、`.ogg` 格式。

已上传的视频可通过 [Change] 替换或 [Remove] 移除。

### 修改问候语

编辑 `src/components/Greeting.jsx` 里的 `GREETINGS` 对象，按时段替换成你想要的文案。

### 修改字体

`App.css` 顶部换掉 Google Fonts 链接，然后全局替换 `Playfair Display` 和 `Noto Serif SC` 即可。

---

## 技术栈

| 技术         | 用途                             |
| ------------ | -------------------------------- |
| React 19     | UI 组件与状态管理                |
| Vite 7       | 构建工具                         |
| CSS3         | 样式（毛玻璃 / 动画 / CSS 变量） |
| localStorage | 设置持久化                       |
| IndexedDB    | 视频文件持久化                   |
| MV3          | 扩展规范                         |

---

## 常见问题

**视频不播放，显示深色背景？**
检查上传的视频格式是否为支持的格式（MP4 / WebM / OGG），或尝试重新上传。

**修改代码后扩展没更新？**
重新 `npm run build:chrome`，然后在 `chrome://extensions/` 页面点击扩展的刷新图标，再打开新标签页。

**能在 Edge 上用吗？**
可以，步骤完全相同，地址栏换成 `edge://extensions/`。

---

## License

[MIT](LICENSE)
