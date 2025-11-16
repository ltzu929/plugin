# B站弹幕分析工具

> 🎯 智能分析B站视频弹幕，快速定位精彩片段

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6-blue.svg)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3-blue.svg)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## 🌟 项目演示

### 📊 核心功能展示

#### 1. 弹幕密度分析图表
![弹幕密度分析](https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=400&fit=crop)

*按时间区间统计弹幕数量（默认1分钟），清晰展示视频节奏变化*

#### 2. 热门弹幕实时悬浮窗
![热门弹幕悬浮窗](https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=400&fit=crop)

*鼠标跟随悬浮窗，实时显示当前时间点±30秒内的热门弹幕（前五，自动合并相似变体）*

#### 3. 多维度数据筛选
![数据筛选功能](https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop)

*支持打call/哈哈/草/？类别密度筛选；相似文本自动合并*

### 🎯 主要特性

| 功能 | 描述 | 状态 |
|------|------|------|
| 📈 弹幕密度分析 | 按时间区间统计（默认1分钟） | ✅ |
| 🔥 热门弹幕识别 | ±30秒时间窗口智能分析 | ✅ |
| 🎯 鼠标跟随悬浮窗 | 实时显示Top 5热门弹幕（合并相似） | ✅ |
| 🎨 现代化UI | 毛玻璃效果+渐变配色 | ✅ |
| 📊 数据导出 | 支持JSON格式导出 | ✅ |
| 🔍 关键词搜索 | 快速定位特定内容 | ✅ |
| 📈 趋势分析 | 移动平均平滑算法 | ✅ |
| 🖼️ 封面加载 | 同源代理/兜底获取视频封面 | ✅ |

## 🆕 UP 主直播回放合集模块

- 输入 B 站合集链接（形如 `https://space.bilibili.com/{mid}/lists/{sid}?type=series`）
- 展示最新 5 个直播回放视频卡片（封面、标题、播放量、发布时间）
- 点击卡片自动跳转并触发弹幕分析
- 历史记录卡片化展示，支持拖拽排序；卡片右上角红色垃圾桶删除；提供清空历史按钮
- 刷新页面按钮仅刷新当前链接数据（强制重新获取，绕过前端缓存）

## 🚀 快速开始

1. 安装依赖：`npm install`
2. 开发联动：`npm run dev`（后端 `http://localhost:3001`，前端 `http://localhost:5173`）
3. 构建与预览：`npm run build`、`npm run preview`
4. 仅后端：`npm run server`

## 🔌 API 路由

- `POST /api/analyze`：输入视频 URL，返回弹幕数据与统计、关键词、封面等
- `GET /api/cover?url=...`：后端代理图片为同源资源，避免浏览器策略拦截
- `GET /api/video/:bvid`：兜底获取指定 BV 号的视频封面
- `POST /api/up-series`：解析 UP 合集链接，返回最新 5 个视频与 UP 名称/头像
- `GET /api/danmaku/:roomId/:date`：直播回放弹幕数据
- `GET /api/danmaku/search/:roomId/:date?keyword=...`：直播弹幕关键词搜索
- `DELETE /api/cache`：清除服务器内存缓存

## 📦 结构概览

```
api/
  server.js              # Express 服务（分析/封面代理/合集解析等）
src/
  components/
    DanmakuChart.tsx     # 弹幕图表与悬浮窗
    UPVideos.tsx         # UP 合集输入/展示/历史记录
    DanmakuAnalysis.tsx  # 视频 URL 分析入口（支持 initialUrl）
    MainApp.tsx          # 主布局与页面切换
  pages/
    VideoAnalysisPage.tsx# 分析页展示
vite.config.ts           # Vite 配置（含 /api 代理）
```

## 🧪 注意事项

- B 站接口存在限流与权限要求，合集解析优先调用系列 API，失败时回退解析 HTML，并在必要时通过视频 Owner 信息兜底补齐 UP 名称与头像
- 图片统一走 `/api/cover` 代理并强制使用 HTTPS，避免 `net::ERR_BLOCKED_BY_ORB`
- 历史记录保存在 `localStorage`，包含时间、UP 名称、头像与链接；拖拽排序会实时保存

## 📝 发布到 GitHub 的建议

- 为发布版打标签（`vX.Y.Z`），并在 Release 中列出变更点（新增 UP 合集、热词前五、类别密度等）
- 添加运行截图（分析页、UP 合集、历史卡片拖拽等）
- 可选：启用 GitHub Actions 进行 Lint/Build（项目含示例，可按需调整）
| 🖼️ 封面加载 | 同源代理/兜底获取视频封面 | ✅ |

## 🚀 快速开始

### 环境要求
- Node.js ≥ 16.0.0
- npm 或 pnpm

### 安装依赖
```bash
# 克隆项目
git clone https://github.com/your-username/bilibili-danmaku-analyzer.git

# 进入项目目录
cd bilibili-danmaku-analyzer

# 安装依赖
npm install
# 或者使用 pnpm
pnpm install
```

### 开发运行
```bash
# 启动开发服务器
npm run dev

# 启动后端API服务（可选）
npm run server
```

### 生产构建
```bash
# 构建项目
npm run build

# 预览构建结果
npm run preview
```

## 📊 技术架构

### 前端技术栈
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **样式**: Tailwind CSS + PostCSS
- **图表**: Recharts
- **图标**: Lucide React
- **状态管理**: React Hooks

### 后端技术栈
- **运行时**: Node.js + Express
- **数据来源**: B站官方API
- **数据处理**: 自定义聚合算法

### 核心算法

#### 1. 弹幕聚合算法
```typescript
// 1分钟间隔弹幕统计
const aggregateDanmakuData = (danmakus: DanmakuItem[]) => {
  return danmakus.reduce((acc, danmaku) => {
    const interval = Math.floor(danmaku.time / 60);
    acc[interval] = (acc[interval] || 0) + 1;
    return acc;
  }, {});
};
```

#### 2. 热门弹幕识别
```typescript
// ±30秒时间窗口热门弹幕分析
const getPopularDanmaku = (danmakus: DanmakuItem[], currentTime: number) => {
  const timeWindow = 30; // 30秒窗口
  const nearbyDanmakus = danmakus.filter(d => 
    Math.abs(d.time - currentTime) <= timeWindow
  );
  
  // 统计相同内容出现次数
  const contentCount = countDuplicateContent(nearbyDanmakus);
  
// 返回Top 5热门弹幕
  return Object.entries(contentCount)
    .map(([content, count]) => ({ content, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};
```

## 🎨 界面设计

### 设计原则
- **现代化**: 采用毛玻璃效果和渐变配色
- **桌面端优先**: 布局与交互针对桌面优化
- **用户友好**: 直观的交互设计和清晰的数据展示
- **性能优化**: 虚拟滚动和懒加载技术

### 色彩方案
- **主色调**: 蓝色到紫色渐变
- **辅助色**: 绿色、橙色、红色用于不同数据类型
- **中性色**: 灰色系用于背景和文字

## 📁 项目结构

```
bilibili-danmaku-analyzer/
├── src/                    # 前端源代码
│   ├── components/         # React组件
│   │   ├── DanmakuChart.tsx       # 弹幕图表组件
│   │   ├── KeywordSearch.tsx      # 关键词搜索
│   │   └── ...
│   ├── pages/              # 页面组件
│   │   ├── HomePage.tsx           # 首页
│   │   ├── VideoAnalysisPage.tsx  # 分析页面
│   │   └── ...
│   ├── hooks/              # 自定义Hooks
│   ├── utils/              # 工具函数
│   └── types/              # TypeScript类型定义
├── api/                    # 后端API
│   └── server.js          # Express服务器
├── public/                 # 静态资源
├── docs/                   # 项目文档
└── tests/                  # 测试文件
```

## 🚀 部署指南

### Vercel部署（推荐）
1. Fork本项目到你的GitHub
2. 登录[Vercel](https://vercel.com)并连接GitHub
3. 选择本项目并部署
4. 自动获取域名或使用自定义域名

### 其他平台
支持Netlify、GitHub Pages、阿里云等任何支持静态网站托管的平台。

## 🔌 API 路由

- `POST /api/analyze`：输入视频URL，返回弹幕数据与统计、关键词、封面等
- `GET /api/cover?url=...`：后端代理图片为同源资源，避免浏览器策略拦截
- `GET /api/video/:bvid`：兜底获取指定 BV 号的视频封面
- `GET /api/danmaku/:roomId/:date`：直播回放弹幕数据
- `GET /api/danmaku/search/:roomId/:date?keyword=...`：直播弹幕关键词搜索
- `DELETE /api/cache`：清除服务器内存缓存

## 🛠️ 最近更新

- 悬浮窗热词仅展示前五，并自动合并“哈哈/？？？”等相似变体
- 取消中英文区分；新增“打call/哈哈/草/？密度”过滤选项
- 新增封面同源代理与兜底接口，修复 `ORB` 拦截导致图片不显示问题
- 去除图表上的折线点，线条更简洁
- UI 去除“1分钟间隔”提示文案（仍按默认1分钟统计）

## 📚 常见问题

- 图片加载报错 `net::ERR_BLOCKED_BY_ORB`
  - 原因：跨站图片被浏览器策略拦截
  - 解决：使用 `GET /api/cover?url=...` 代理为同源资源，或通过 `GET /api/video/:bvid` 兜底拉取封面


## 📈 开发计划

### 近期目标
- [ ] 支持更多视频平台
- [ ] 添加弹幕情感分析
- [ ] 实现词云可视化
- [ ] 支持用户登录和数据保存

### 长期愿景
- [ ] AI智能精彩片段提取
- [ ] 弹幕互动热力图
- [ ] 多视频对比分析
- [ ] 社区分享功能

## ⭐ Star历史

[![Star History Chart](https://api.star-history.com/svg?repos=your-username/bilibili-danmaku-analyzer&type=Date)](https://star-history.com/#your-username/bilibili-danmaku-analyzer&Date)

---

<div align="center">
  <p>⭐ 如果这个项目对你有帮助，请给个Star支持一下！</p>
  <p>🚀 欢迎贡献代码和提出宝贵建议</p>
</div>