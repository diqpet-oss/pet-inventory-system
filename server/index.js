const express = require('express');
const connectDB = require('./config/db');
const inboundRoutes = require('./routes/inbound');
require('dotenv').config();

const app = express();
connectDB(); // 连接数据库

// 中间件
app.use(express.json()); // 解析JSON请求体
app.use((req, res, next) => { // 跨域配置
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// 挂载接口
app.use('/api/inbound', inboundRoutes);

// 启动服务（Vercel Serverless 需导出 app）
module.exports = app;
