const mysql = require('mysql2');

// 创建数据库连接池
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',      // 您的 Navicat/MySQL 用户名
  // -----------------------------------------------------------
  // ⚠️ 注意：如果报错 "Access denied"，请修改下面的密码！
  // 常见密码: '123456', 'root', 'password', 或空字符串 ''
  // -----------------------------------------------------------
  password: '123456',   
  database: 'village_sports', // 数据库名称
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+08:00' // 设置时区为中国标准时间
});

// 封装为 Promise 形式
const promisePool = pool.promise();

// --- 启动时立即测试连接 ---
promisePool.getConnection()
  .then(connection => {
    console.log('✅ [DB] 数据库连接成功 (Database Connected Successfully)');
    connection.release();
  })
  .catch(err => {
    console.error('❌ [DB] 数据库连接失败 (Database Connection Failed)');
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
        console.error('👉 原因：密码错误。请打开 db.js 修改 password 字段。');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
        console.error('👉 原因：数据库不存在。请先在 Navicat 中创建 village_sports 数据库并导入 SQL。');
    } else {
        console.error('👉 错误详情:', err.message);
    }
  });

module.exports = promisePool;