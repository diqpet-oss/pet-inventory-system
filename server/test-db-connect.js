// 引入 mongoose（如果没装，先执行 npm install mongoose）
const mongoose = require('mongoose');

// 你的 MongoDB 连接字符串
const MONGODB_URI = 'mongodb+srv://diqpet_db_user:2a26kiMRDEC5b88T@diqpet.fh8nhhv.mongodb.net/?appName=diqpet';
                                       

// 测试连接的函数
async function testDBConnection() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ 连接成功！用户名和密码正确');
    await mongoose.disconnect(); // 连接成功后断开
  } catch (error) {
    console.error('❌ 连接失败：', error.message);
    if (error.message.includes('Authentication failed')) {
      console.log('→ 原因：用户名或密码错误');
    } else if (error.message.includes('Host not found')) {
      console.log('→ 原因：集群地址（cluster.mongodb.net）错误');
    }
  }
}

// 执行测试
testDBConnection();