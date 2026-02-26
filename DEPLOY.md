# 宠物服饰进销存管理系统 - GitHub + Vercel 部署教程

## 项目结构

```
app/
├── src/                    # 前端代码
│   ├── sections/          # 页面组件
│   ├── store/             # 状态管理
│   ├── services/          # API 服务
│   ├── data/              # 基础数据
│   └── types/             # TypeScript 类型
├── server/                # 后端代码
│   ├── src/
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # API 路由
│   │   └── config/        # 配置文件
│   └── package.json
├── dist/                  # 前端构建输出
├── package.json           # 前端依赖
└── vercel.json           # Vercel 配置
```

## 第一步：创建 MongoDB Atlas 数据库

1. 访问 [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) 并注册账号
2. 创建一个新的集群（免费版即可）
3. 在 Database Access 中创建数据库用户
4. 在 Network Access 中添加 IP 地址 `0.0.0.0/0`（允许所有 IP）
5. 进入你的集群，点击 "Connect" → "Drivers" → "Node.js"
6. 复制连接字符串，格式如下：
   ```
   mongodb+srv://username:password@cluster.mongodb.net/pet-inventory?retryWrites=true&w=majority
   ```

## 第二步：创建 GitHub 仓库

### 1. 初始化 Git 仓库

```bash
# 在项目根目录执行
cd /mnt/okcomputer/output/app
git init
```

### 2. 创建 .gitignore 文件

```bash
# 在项目根目录创建 .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
server/node_modules/
.pnp
.pnp.js

# Build outputs
dist/
server/dist/
build/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
server/.env

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
EOF
```

### 3. 提交代码

```bash
# 添加所有文件
git add .

# 提交
git commit -m "Initial commit: Pet Inventory Management System"
```

### 4. 创建 GitHub 仓库并推送

1. 访问 [GitHub](https://github.com) 并登录
2. 点击右上角 "+" → "New repository"
3. 填写仓库名称：`pet-inventory-system`
4. 选择 "Public" 或 "Private"
5. 点击 "Create repository"
6. 按照 GitHub 提示推送代码：

```bash
# 添加远程仓库（替换 YOUR_USERNAME 为你的 GitHub 用户名）
git remote add origin https://github.com/YOUR_USERNAME/pet-inventory-system.git

# 推送代码
git branch -M main
git push -u origin main
```

## 第三步：部署后端到 Vercel

### 1. 准备后端部署

```bash
# 进入后端目录
cd server

# 安装依赖
npm install

# 返回项目根目录
cd ..
```

### 2. 部署到 Vercel

#### 方式一：通过 Vercel CLI（推荐）

```bash
# 全局安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署后端
cd server
vercel --prod

# 按照提示操作：
# ? Set up and deploy "~/pet-inventory-system/server"? [Y/n] Y
# ? Which scope do you want to deploy to? [你的账号]
# ? Link to existing project? [n]
# ? What's your project name? [pet-inventory-api]
```

#### 方式二：通过 Vercel 网站

1. 访问 [Vercel](https://vercel.com) 并登录
2. 点击 "Add New Project"
3. 导入你的 GitHub 仓库
4. 在配置页面：
   - **Framework Preset**: Other
   - **Root Directory**: `server`
   - **Build Command**: 留空
   - **Output Directory**: 留空
5. 点击 "Environment Variables" 添加：
   - `MONGODB_URI`: 你的 MongoDB 连接字符串
6. 点击 "Deploy"

### 3. 获取后端 API 地址

部署成功后，Vercel 会提供一个域名，例如：
```
https://pet-inventory-api.vercel.app
```

## 第四步：部署前端到 Vercel

### 1. 更新前端 API 配置

编辑 `app/.env` 文件：

```bash
# 替换为你的后端地址
VITE_API_URL=https://pet-inventory-api.vercel.app/api
```

### 2. 提交更新

```bash
git add .
git commit -m "Update API URL for production"
git push
```

### 3. 部署前端

#### 方式一：通过 Vercel CLI

```bash
# 在项目根目录执行
vercel --prod

# 按照提示操作：
# ? Set up and deploy "~/pet-inventory-system"? [Y/n] Y
# ? Which scope do you want to deploy to? [你的账号]
# ? Link to existing project? [n]
# ? What's your project name? [pet-inventory-system]
```

#### 方式二：通过 Vercel 网站

1. 访问 [Vercel](https://vercel.com)
2. 点击 "Add New Project"
3. 导入同一个 GitHub 仓库
4. 在配置页面：
   - **Framework Preset**: Vite
   - **Root Directory**: `./`（根目录）
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 点击 "Environment Variables" 添加：
   - `VITE_API_URL`: 你的后端 API 地址（如 `https://pet-inventory-api.vercel.app/api`）
6. 点击 "Deploy"

## 第五步：初始化数据库数据

### 1. 安装后端依赖

```bash
cd server
npm install
```

### 2. 创建初始化脚本

创建 `server/src/scripts/initData.ts`：

```typescript
import { connectDB } from '../config/database';
import Product from '../models/Product';

const EXCHANGE_RATE = 190;

const createDualPrice = (cny: number) => ({
  cny,
  krw: Math.round(cny * EXCHANGE_RATE)
});

const initData = async () => {
  await connectDB();

  // 清空现有数据
  await Product.deleteMany({});

  // 产品1: 狗狗冲锋衣
  const product1 = {
    id: 'prod-001',
    name: '狗狗冲锋衣',
    productId: '9312183755',
    description: '户外防水防风冲锋衣',
    skus: [
      { id: 'sku-001', productId: '9312183755', productName: '狗狗冲锋衣', skuCode: '94647662186', size: 'L', purchasePrice: createDualPrice(45), salePrice: createDualPrice(118) },
      { id: 'sku-002', productId: '9312183755', productName: '狗狗冲锋衣', skuCode: '94647662188', size: 'S', purchasePrice: createDualPrice(45), salePrice: createDualPrice(118) },
      { id: 'sku-003', productId: '9312183755', productName: '狗狗冲锋衣', skuCode: '94647662190', size: 'M', purchasePrice: createDualPrice(45), salePrice: createDualPrice(118) },
      { id: 'sku-004', productId: '9312183755', productName: '狗狗冲锋衣', skuCode: '94647662187', size: 'XL', purchasePrice: createDualPrice(48), salePrice: createDualPrice(128) },
      { id: 'sku-005', productId: '9312183755', productName: '狗狗冲锋衣', skuCode: '94647662189', size: 'XXL', purchasePrice: createDualPrice(52), salePrice: createDualPrice(138) }
    ]
  };

  // 产品2: 大狗居家服
  const product2 = {
    id: 'prod-002',
    name: '大狗居家服',
    productId: '9286790289',
    description: '防掉毛舒适家居服',
    skus: [
      { id: 'sku-006', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772480', size: 'XL', purchasePrice: createDualPrice(42), salePrice: createDualPrice(108) },
      { id: 'sku-007', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772481', size: 'XXL', purchasePrice: createDualPrice(45), salePrice: createDualPrice(118) },
      { id: 'sku-008', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772488', size: '3XL', purchasePrice: createDualPrice(48), salePrice: createDualPrice(128) },
      { id: 'sku-009', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772482', size: '4XL', purchasePrice: createDualPrice(52), salePrice: createDualPrice(138) },
      { id: 'sku-010', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772483', size: '5XL', purchasePrice: createDualPrice(55), salePrice: createDualPrice(148) },
      { id: 'sku-011', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772485', size: '6XL', purchasePrice: createDualPrice(58), salePrice: createDualPrice(158) },
      { id: 'sku-012', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772484', size: '7XL', purchasePrice: createDualPrice(62), salePrice: createDualPrice(168) },
      { id: 'sku-013', productId: '9286790289', productName: '大狗居家服', skuCode: '94529772486', size: '8XL', purchasePrice: createDualPrice(65), salePrice: createDualPrice(178) }
    ]
  };

  await Product.create(product1);
  await Product.create(product2);

  console.log('数据初始化完成');
  process.exit(0);
};

initData();
```

### 3. 运行初始化脚本

```bash
# 在 server 目录下执行
npx tsx src/scripts/initData.ts
```

## 第六步：验证部署

### 1. 检查后端 API

访问你的后端地址：
```
https://pet-inventory-api.vercel.app/api/health
```

应该返回：
```json
{ "status": "ok", "timestamp": "..." }
```

### 2. 访问前端应用

打开 Vercel 提供的前端地址，验证所有功能：
- 仪表盘
- 库存台账
- 入库单
- 出库单
- 产品管理

## 常见问题

### 1. CORS 错误

确保后端 `server/src/index.ts` 中的 CORS 配置正确：
```typescript
app.use(cors());
```

### 2. 数据库连接失败

- 检查 MongoDB Atlas 的 Network Access 是否允许所有 IP
- 确认连接字符串中的用户名和密码正确
- 确保密码中的特殊字符已正确编码

### 3. 环境变量不生效

- 在 Vercel 项目设置中重新添加环境变量
- 重新部署项目

### 4. 前端 API 请求失败

- 检查 `VITE_API_URL` 是否正确设置
- 确保以 `VITE_` 开头（Vite 要求）
- 重新构建并部署

## 更新部署

### 前端更新

```bash
# 修改代码后
git add .
git commit -m "Update frontend"
git push

# Vercel 会自动重新部署
```

### 后端更新

```bash
# 修改代码后
git add .
git commit -m "Update backend"
git push

# 进入后端目录重新部署
cd server
vercel --prod
```

## 本地开发

### 启动后端

```bash
cd server
npm install
npm run dev
```

后端运行在 http://localhost:3000

### 启动前端

```bash
# 在项目根目录
npm install
npm run dev
```

前端运行在 http://localhost:5173

## 技术栈

- **前端**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **后端**: Node.js + Express + TypeScript
- **数据库**: MongoDB Atlas
- **部署**: Vercel

## 登录信息

- **用户名**: diqpet@gmail.com
- **密码**: 88819116
