import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    // 使用环境变量或默认连接字符串
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://diqpet_db_user:2a26kiMRDEC5b88T@diqpet.fh8nhhv.mongodb.net/diqpet?retryWrites=true&w=majority';
    await mongoose.connect(mongoUri);
    console.log('MongoDB 连接成功');
  } catch (error) {
    console.error('MongoDB 连接失败:', error);
    process.exit(1);
  }
};
