# 木木象棋 🏆

[![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-Live-brightgreen)](https://你的用户名.github.io/mumu-chess)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![TensorFlow.js](https://img.shields.io/badge/TensorFlow.js-AI-orange.svg)](https://www.tensorflow.org/js)

> 🎮 **在线试玩**: [https://你的用户名.github.io/mumu-chess](https://你的用户名.github.io/mumu-chess)

一个具备深度学习AI的智能中国象棋游戏，支持人机对战和AI自我训练。

![游戏截图](https://via.placeholder.com/800x400/1a1a1a/ffffff?text=木木象棋+游戏界面)

## ✨ 特色功能

### 🧠 多层次AI系统
- **高级AI算法**：Alpha-Beta剪枝搜索，4层深度分析
- **深度学习AI**：TensorFlow.js神经网络，自我学习能力
- **预训练知识库**：内置开局库、战术模式、残局知识

### 🎮 游戏模式
- **人机对战**：与智能AI对弈，多种难度选择
- **AI训练**：观看AI自我对战学习，持续提升实力
- **学习模式**：AI从每局游戏中学习，越战越强

### 🎯 智能特性
- **开局知识**：中炮、仙人指路、飞相等经典开局
- **战术识别**：马后炮、卧槽马、铁门栓等战术组合
- **残局技巧**：车兵对车、马炮对马炮等残局处理
- **防止死循环**：移动限制、重复检测、超时机制

## 🚀 在线体验

### 部署方法

#### 方法1：Netlify（推荐）
1. 访问 [netlify.com](https://netlify.com)
2. 注册账号
3. 拖拽项目文件夹到部署区域
4. 获得网址，立即可玩

#### 方法2：GitHub Pages
1. 创建GitHub仓库
2. 上传所有项目文件
3. 启用GitHub Pages
4. 通过 `https://用户名.github.io/仓库名` 访问

#### 方法3：Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 连接GitHub或上传文件
3. 自动部署获得网址

## 📁 项目文件

```
木木象棋/
├── index.html              # 主页面
├── style.css              # 样式文件
├── script.js              # 主要游戏逻辑
├── deep-learning-ai.js    # 深度学习AI
├── advanced-ai.js         # 高级AI算法
├── pretrained-data.js     # 预训练数据
├── 背景图片.png           # 背景图片
└── README.md              # 说明文档
```

## 🎯 使用说明

### 基本操作
1. **开始游戏**：点击"重新开始"按钮
2. **移动棋子**：点击棋子再点击目标位置
3. **AI对战**：选择AI模式，设置难度
4. **训练AI**：点击"开始训练"观看AI学习

### AI设置
- **使用高级AI**：启用Alpha-Beta搜索算法
- **使用深度学习**：启用神经网络AI
- **训练速度**：调整AI训练的速度
- **保存数据**：手动保存AI训练成果

### 训练模式
1. 选择"AI对战"模式
2. 点击"开始训练"
3. AI会自动对战学习
4. 每10局自动保存训练数据
5. 停止训练时自动保存

## 🔧 技术特点

### 前端技术
- **纯JavaScript**：无框架依赖，轻量级
- **TensorFlow.js**：浏览器端深度学习
- **Canvas绘图**：流畅的游戏界面
- **LocalStorage**：本地数据持久化

### AI算法
- **Alpha-Beta剪枝**：经典的博弈树搜索
- **神经网络**：深度学习位置评估
- **经验回放**：强化学习训练机制
- **预训练数据**：象棋知识库

### 性能优化
- **搜索剪枝**：提高AI思考效率
- **移动排序**：优先考虑重要移动
- **时间限制**：防止AI思考过久
- **内存管理**：限制训练数据大小

## 🎮 游戏规则

### 象棋基本规则
- 红方先行，轮流移动
- 将死或困毙判负
- 将/帅不能照面

### 防止无限对局
- 最大150步移动限制
- 连续50步无吃子判和
- 重复局面3次判和
- 训练模式30秒超时

## 📱 兼容性

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+
- ✅ 移动端浏览器

## 🔮 未来计划

- [ ] 多人在线对战
- [ ] 棋谱分析功能
- [ ] 更多AI难度等级
- [ ] 开局库扩展
- [ ] 残局练习模式
- [ ] 棋谱导入导出

## 📄 开源协议

MIT License - 欢迎贡献代码和建议！

## 🤝 贡献

欢迎提交Issue和Pull Request来改进游戏：
- 报告Bug
- 建议新功能
- 优化AI算法
- 改进用户界面

---

**享受智能象棋的乐趣！** 🎉

如果你喜欢这个项目，请给个⭐Star支持一下！
