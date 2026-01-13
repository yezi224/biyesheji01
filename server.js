const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3001; // 前端运行在 3000 或其他端口，后端运行在 3001

// 中间件
app.use(cors());
app.use(bodyParser.json());

// --- 健康检查接口 ---
app.get('/api/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ status: 'ok', database: 'connected' });
    } catch (err) {
        res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
    }
});

// --- 根路径路由 (解决 Cannot GET /) ---
app.get('/', (req, res) => {
  res.send(`
    <div style="font-family: sans-serif; padding: 20px;">
      <h1>Village Sports Backend Service</h1>
      <p>✅ Backend is running on port <strong>${PORT}</strong></p>
      <p>📡 API Base URL: <code>/api</code></p>
      <hr />
      <p>To view the web application, please start the frontend server separately.</p>
    </div>
  `);
});

// --- 辅助函数：转换下划线字段为驼峰命名 (DB -> Frontend) ---
const mapUser = (u) => {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    realName: u.real_name,
    role: u.role,
    villageName: u.village_name,
    phone: u.phone,
    exercisePref: u.exercise_pref,
    status: u.status
  };
};

const mapEvent = (e) => ({
    id: e.id,
    title: e.title,
    organizerId: e.organizer_id,
    organizerName: e.organizer_name || '未知组织', // 需要联表查询优化，这里简化
    rule: e.rule,
    time: e.time,
    location: e.location,
    theme: e.theme,
    status: e.status,
    imgUrl: e.img_url,
    participantsCount: e.participants_count || 0
});

// --- API 路由 ---

// 1. 用户模块
app.post('/api/users/login', async (req, res) => {
    const { username, password } = req.body;
    console.log(`[LOGIN ATTEMPT] User: ${username}`);
    try {
        const [rows] = await db.query('SELECT * FROM sys_user WHERE username = ? AND password = ?', [username, password]);
        if (rows.length > 0) {
            const user = rows[0];
            // 检查用户状态
            if (user.status === 0) {
                console.warn(`[LOGIN DENIED] User ${username} is pending approval.`);
                return res.status(403).json({ message: '账号正在审核中，请耐心等待管理员批准。' });
            }
            if (user.status === 2) {
                return res.status(403).json({ message: '账号已被禁用。' });
            }

            console.log(`[LOGIN SUCCESS] User ID: ${user.id}`);
            res.json(mapUser(user));
        } else {
            console.warn(`[LOGIN FAILED] Invalid credentials for ${username}`);
            res.status(401).json({ message: '账号或密码错误' });
        }
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users/register', async (req, res) => {
    const { username, password, realName, role, villageName, phone } = req.body;
    // 修改：所有新注册用户（管理员除外，但管理员通常不通过此接口注册）默认都需要审核 (Status 0)
    const status = 0; 
    try {
        const [result] = await db.query(
            'INSERT INTO sys_user (username, password, real_name, role, village_name, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [username, password, realName, role, villageName, phone, status]
        );
        res.json({ id: result.insertId, username, realName, role, status });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM sys_user');
        res.json(rows.map(mapUser));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 更新用户状态 (审核/禁用)
app.put('/api/users/:id/status', async (req, res) => {
    const { status } = req.body; // 1: Active, 2: Banned, 0: Pending
    try {
        await db.query('UPDATE sys_user SET status = ? WHERE id = ?', [status, req.params.id]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM sys_user WHERE id = ?', [req.params.id]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. 赛事模块
app.get('/api/events', async (req, res) => {
    try {
        // 简单的联表查询获取组织者名称
        const sql = `
            SELECT e.*, u.real_name as organizer_name,
            (SELECT COUNT(*) FROM event_registration r WHERE r.event_id = e.id) as participants_count
            FROM event_info e
            LEFT JOIN sys_user u ON e.organizer_id = u.id
            ORDER BY e.time DESC
        `;
        const [rows] = await db.query(sql);
        res.json(rows.map(mapEvent));
    } catch (err) {
        console.error("Get Events Error:", err);
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/events/recommend', async (req, res) => {
    // 简化的推荐：返回所有状态为 OPEN 的赛事
    try {
        const sql = `
            SELECT e.*, u.real_name as organizer_name 
            FROM event_info e 
            LEFT JOIN sys_user u ON e.organizer_id = u.id
            WHERE e.status = 'OPEN'
        `;
        const [rows] = await db.query(sql);
        res.json(rows.map(mapEvent));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/events', async (req, res) => {
    console.log("[CREATE EVENT] Body received:", req.body);
    const { title, organizerId, rule, time, location, theme, imgUrl } = req.body;
    
    // 简单的格式处理：将前端的 '2024-05-20T14:00' 转换为 MySQL 友好的 '2024-05-20 14:00:00'
    let formattedTime = time;
    if (time && time.includes('T')) {
        formattedTime = time.replace('T', ' ');
        if (formattedTime.length === 16) formattedTime += ':00'; // 补全秒
    }

    try {
        const [result] = await db.query(
            'INSERT INTO event_info (title, organizer_id, rule, time, location, theme, status, img_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, organizerId, rule, formattedTime, location, theme, 'OPEN', imgUrl || 'https://picsum.photos/800/400']
        );
        console.log("[CREATE EVENT] Success, Insert ID:", result.insertId);
        res.json({ id: result.insertId, title });
    } catch (err) {
        console.error("[CREATE EVENT] Failed:", err);
        res.status(500).json({ error: err.message });
    }
});

// 修改赛事
app.put('/api/events/:id', async (req, res) => {
    console.log("[UPDATE EVENT] ID:", req.params.id, "Body:", req.body);
    const { title, rule, time, location, theme } = req.body;
    
    let formattedTime = time;
    if (time && time.includes('T')) {
        formattedTime = time.replace('T', ' ');
        if (formattedTime.length === 16) formattedTime += ':00';
    }

    try {
        await db.query(
            'UPDATE event_info SET title = ?, rule = ?, time = ?, location = ?, theme = ? WHERE id = ?',
            [title, rule, formattedTime, location, theme, req.params.id]
        );
        res.sendStatus(200);
    } catch (err) {
        console.error("[UPDATE EVENT] Failed:", err);
        res.status(500).json({ error: err.message });
    }
});

// 删除赛事
app.delete('/api/events/:id', async (req, res) => {
    try {
        // 先删除相关的报名记录 (可选，取决于数据库是否有外键级联删除)
        await db.query('DELETE FROM event_registration WHERE event_id = ?', [req.params.id]);
        // 再删除赛事
        await db.query('DELETE FROM event_info WHERE id = ?', [req.params.id]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/events/:id/register', async (req, res) => {
    const { userId, healthDeclare } = req.body;
    try {
        // 检查是否已报名
        const [exists] = await db.query('SELECT id FROM event_registration WHERE event_id = ? AND user_id = ?', [req.params.id, userId]);
        if(exists.length > 0) return res.status(400).json({message: '已报名'});

        await db.query('INSERT INTO event_registration (event_id, user_id, health_declare) VALUES (?, ?, ?)', [req.params.id, userId, healthDeclare]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. 物资模块
app.get('/api/materials', async (req, res) => {
    try {
        // 使用更精确的别名查询，确保列名不冲突
        const sql = `
            SELECT 
                m.id, m.name, m.type, m.condition_level, m.donor_id, m.status, m.current_holder_id,
                u.real_name as donor_name, 
                h.real_name as holder_name
            FROM material m 
            LEFT JOIN sys_user u ON m.donor_id = u.id
            LEFT JOIN sys_user h ON m.current_holder_id = h.id
        `;
        const [rows] = await db.query(sql);
        // 确保字段映射无误
        const materials = rows.map(m => ({
            id: m.id,
            name: m.name,
            type: m.type,
            conditionLevel: parseInt(m.condition_level) || 5,
            donorId: m.donor_id,
            donorName: m.donor_name || '未知',
            status: m.status,
            currentHolderId: m.current_holder_id,
            holderName: m.holder_name // 如果为 null, 前端会处理
        }));
        res.json(materials);
    } catch (err) {
        console.error('Get Materials Error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/materials', async (req, res) => {
    const { name, type, conditionLevel, donorId } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO material (name, type, condition_level, donor_id, status) VALUES (?, ?, ?, ?, ?)',
            [name, type, conditionLevel, donorId, 'PENDING']
        );
        res.json({ id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/materials/:id/borrow', async (req, res) => {
    const { userId } = req.body;
    try {
        // 校验：检查用户角色，如果是管理员则拒绝
        const [users] = await db.query('SELECT role FROM sys_user WHERE id = ?', [userId]);
        if (users.length > 0 && users[0].role !== 'VILLAGER') {
            return res.status(403).json({ message: '仅村民可以借用物资' });
        }

        await db.query('UPDATE material SET status = ?, current_holder_id = ? WHERE id = ?', ['BORROWED', userId, req.params.id]);
        
        // 可选：插入流转记录
        // await db.query('INSERT INTO material_record ...');

        res.sendStatus(200);
    } catch (err) {
        console.error('Borrow Error:', err);
        res.status(500).json({ error: err.message });
    }
});

// 归还物资 (或强制归还)
app.post('/api/materials/:id/return', async (req, res) => {
    try {
        await db.query('UPDATE material SET status = ?, current_holder_id = NULL WHERE id = ?', ['IN_STOCK', req.params.id]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 更新物资状态 (审核/上下架)
app.put('/api/materials/:id/status', async (req, res) => {
    const { status } = req.body;
    try {
        await db.query('UPDATE material SET status = ? WHERE id = ?', [status, req.params.id]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 删除物资 (级联删除记录)
app.delete('/api/materials/:id', async (req, res) => {
    try {
        console.log(`[DELETE MATERIAL] ID: ${req.params.id}`);
        // 1. 尝试删除流转记录 (即使没有记录也不报错)
        await db.query('DELETE FROM material_record WHERE material_id = ?', [req.params.id]);
        
        // 2. 删除物资
        const [result] = await db.query('DELETE FROM material WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: '物资不存在或已被删除' });
        }

        res.sendStatus(200);
    } catch (err) {
        console.error('[DELETE MATERIAL FAILED]', err);
        // 返回详细错误给前端，方便调试
        res.status(500).json({ error: err.message, sqlMessage: err.sqlMessage });
    }
});

// 4. 互动模块
app.get('/api/interactions', async (req, res) => {
    const types = req.query.types ? req.query.types.split(',') : null;
    try {
        let sql = `
            SELECT i.*, u.real_name as user_name, u.role as user_role 
            FROM interaction i 
            LEFT JOIN sys_user u ON i.user_id = u.id
        `;
        let params = [];
        if (types) {
            sql += ' WHERE i.type IN (?)';
            params.push(types);
        }
        sql += ' ORDER BY i.create_time DESC';
        
        const [rows] = await db.query(sql, params);
        res.json(rows.map(row => ({
            id: row.id,
            userId: row.user_id,
            userName: row.user_name,
            userRole: row.user_role,
            type: row.type,
            title: row.title || '',
            content: row.content,
            replyContent: row.reply_content,
            createTime: row.create_time
        })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/interactions', async (req, res) => {
    const { userId, type, title, content } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO interaction (user_id, type, title, content) VALUES (?, ?, ?, ?)',
            [userId, type, title, content]
        );
        res.json({ id: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 修改互动 (系统公告修改)
app.put('/api/interactions/:id', async (req, res) => {
    const { title, content } = req.body;
    try {
        await db.query('UPDATE interaction SET title = ?, content = ? WHERE id = ?', [title, content, req.params.id]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/interactions/:id/reply', async (req, res) => {
    const { replyContent } = req.body;
    try {
        await db.query('UPDATE interaction SET reply_content = ? WHERE id = ?', [replyContent, req.params.id]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/interactions/:id', async (req, res) => {
    try {
        await db.query('DELETE FROM interaction WHERE id = ?', [req.params.id]);
        res.sendStatus(200);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 统计接口 (Real Database Data)
app.get('/api/stats/participation', async (req, res) => {
    try {
        // 统计不同主题赛事的数量 (或者可以改为统计每个赛事的报名人数)
        // 这里按主题分组，展示不同类型的赛事热度
        const sql = `
            SELECT theme as name, COUNT(*) as value 
            FROM event_info 
            GROUP BY theme
        `;
        const [rows] = await db.query(sql);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 启动服务
app.listen(PORT, () => {
    console.log(`✅ Server is running on http://localhost:${PORT}`);
    console.log(`⏳ Waiting for database connection...`);
});