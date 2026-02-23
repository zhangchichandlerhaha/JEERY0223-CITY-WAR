# JERRY 新星防御 (JERRY Nova Defense)

一个基于 React + Vite + Tailwind CSS 开发的经典导弹防御类塔防游戏。

## 🚀 部署到 Vercel 指南

### 1. 准备工作
- 将此项目上传到你的 GitHub 仓库。
- 注册并登录 [Vercel](https://vercel.com/)。

### 2. 导入项目
- 在 Vercel 控制台点击 **"Add New"** -> **"Project"**。
- 选择你的 GitHub 仓库并点击 **"Import"**。

### 3. 配置环境变量 (关键)
在部署页面的 **"Environment Variables"** 部分，添加以下变量：

| Key | Value | 说明 |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | `你的_GEMINI_API_KEY` | 从 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取 |

### 4. 部署
- 点击 **"Deploy"**。
- Vercel 会自动识别 Vite 配置并完成构建。

## 🛠️ 技术栈
- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS 4
- **Animation**: Motion (Framer Motion)
- **AI**: Google Gemini API (用于生成动态游戏背景介绍)
- **Icons**: Lucide React

## 🎮 玩法说明
- 点击屏幕发射拦截导弹。
- 预判敌方火箭的下落路径。
- 保护你的城市不被摧毁。
- 得到 1000 分即获胜！
