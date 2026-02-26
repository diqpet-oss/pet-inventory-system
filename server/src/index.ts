import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database';

// 导入路由
import productsRouter from './routes/products';
import inventoryRouter from './routes/inventory';
import inboundRouter from './routes/inbound';
import outboundRouter from './routes/outbound';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 连接数据库
connectDB();

// 路由
app.use('/api/products', productsRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/inbound', inboundRouter);
app.use('/api/outbound', outboundRouter);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: '宠物服饰进销存管理系统 API',
    version: '1.0.0',
    endpoints: {
      products: '/api/products',
      inventory: '/api/inventory',
      inbound: '/api/inbound',
      outbound: '/api/outbound',
      health: '/api/health'
    }
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

export default app;
