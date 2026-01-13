import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout.tsx';
import { User, EventInfo, Material, Role, UserStatus, MaterialType, EventStatus, MaterialStatus, Interaction, InteractionType } from './types';
import { ApiService } from './services/api';
//import { generateEventTheme, consultSportsExpert } from './services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// --- Translation Helpers ---

const translateEventStatus = (status: EventStatus) => {
  switch (status) {
    case EventStatus.OPEN: return '报名中';
    case EventStatus.PROGRESS: return '进行中';
    case EventStatus.END: return '已结束';
    default: return status;
  }
};

const translateMaterialStatus = (status: MaterialStatus) => {
  switch (status) {
    case MaterialStatus.PENDING: return '审核中';
    case MaterialStatus.IN_STOCK: return '在库';
    case MaterialStatus.BORROWED: return '已借出';
    case MaterialStatus.LOST: return '丢失';
    default: return status;
  }
};

const translateMaterialType = (type: MaterialType) => {
  switch (type) {
    case MaterialType.EQUIPMENT: return '器材';
    case MaterialType.CLOTHING: return '服装';
    case MaterialType.OTHER: return '其他';
    default: return type;
  }
};

// --- DB Status Component ---
const DbStatus = () => {
    const [status, setStatus] = useState<'checking' | 'connected' | 'offline'>('checking');

    useEffect(() => {
        const check = async () => {
            const isConnected = await ApiService.checkHealth();
            setStatus(isConnected ? 'connected' : 'offline');
        };
        check();
        const interval = setInterval(check, 10000); // Check every 10s
        return () => clearInterval(interval);
    }, []);

    if (status === 'connected') {
        return (
            <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur border border-green-200 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold text-green-700 z-50 animate-fade-in">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                数据库已连接 (MySQL)
            </div>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 bg-white/90 backdrop-blur border border-red-200 px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-xs font-bold text-red-600 z-50 animate-fade-in group cursor-help">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            连接失败 (请检查密码)
            <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-gray-800 text-white text-xs rounded hidden group-hover:block">
                无法连接到本地数据库。通常是 db.js 中的密码与您本地 MySQL 密码不一致。
            </div>
        </div>
    );
};

// --- Views Components defined internally for simplicity of the single-file requirement context ---

const LoginView = ({ onLogin }: { onLogin: (u: User) => void }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dbConfigError, setDbConfigError] = useState(false);
  
  // Login Form State
  const [username, setUsername] = useState('org_committee');
  const [password, setPassword] = useState('123');

  // Register Form State
  const [regData, setRegData] = useState({
    username: '',
    password: '',
    realName: '',
    villageName: '',
    phone: '',
    role: Role.VILLAGER
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDbConfigError(false);
    ApiService.login(username, password)
      .then(user => onLogin(user))
      .catch((err) => {
          if (err.message && err.message.includes("Access denied")) {
              setDbConfigError(true);
          } else {
              alert(`登录失败: ${err.message}`);
          }
      })
      .finally(() => setLoading(false));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    ApiService.register(regData)
      .then(user => {
        alert(`注册成功! 您的账号处于待审核状态，请等待管理员审核通过后登录。`);
        setIsRegister(false);
      })
      .catch((err) => {
          if (err.message && err.message.includes("Access denied")) {
              setDbConfigError(true);
          } else {
              alert(`注册失败: ${err.message}`);
          }
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-700 p-4 font-sans relative">
      <DbStatus />
      
      {/* DB Config Error Modal */}
      {dbConfigError && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
                <div className="bg-red-600 p-4 text-white flex items-center">
                    <i className="fas fa-database text-2xl mr-3"></i>
                    <h3 className="text-xl font-bold">数据库连接失败</h3>
                </div>
                <div className="p-6">
                    <p className="text-gray-700 font-bold mb-2">错误代码：Access denied for user 'root'</p>
                    <p className="text-gray-600 mb-4 text-sm">
                        这表示代码中配置的数据库密码与您本地 MySQL 的密码不匹配。
                    </p>
                    <div className="bg-gray-100 p-4 rounded border border-gray-300 mb-4">
                        <p className="text-xs text-gray-500 mb-1 font-mono">请修改文件: /db.js</p>
                        <code className="text-sm font-mono text-blue-700 block bg-white p-2 border rounded">
                        password: '123',  // &lt;-- 将此处修改为您的真实密码
                        </code>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                        <p>1. 打开项目根目录下的 <b>db.js</b> 文件。</p>
                        <p>2. 修改 password 字段 (如果是空密码请填 '')。</p>
                        <p>3. <b>重启后端服务</b> (Ctrl+C 停止后重新运行 npm start)。</p>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 flex justify-end">
                    <button onClick={() => setDbConfigError(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors">我已了解</button>
                </div>
            </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md backdrop-blur-sm bg-opacity-95 transition-all">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4 animate-bounce-slow">
             <i className="fas fa-leaf text-3xl"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">乡村体育</h2>
          <p className="text-gray-500 mt-2 text-sm">{isRegister ? '创建您的账号' : '连接乡村，凝聚力量'}</p>
        </div>
        
        {isRegister ? (
          /* Registration Form */
          <form onSubmit={handleRegister} className="space-y-4">
             <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">用户名</label>
                  <input required type="text" value={regData.username} onChange={e => setRegData({...regData, username: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="账号" />
               </div>
               <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">真实姓名</label>
                  <input required type="text" value={regData.realName} onChange={e => setRegData({...regData, realName: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="姓名" />
               </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">密码</label>
                <input required type="password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="设置密码" />
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div>
                   <label className="block text-xs font-bold text-gray-700 mb-1">所属村庄</label>
                   <input required type="text" value={regData.villageName} onChange={e => setRegData({...regData, villageName: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="如：幸福村" />
                </div>
                <div>
                   <label className="block text-xs font-bold text-gray-700 mb-1">联系电话</label>
                   <input type="tel" value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="手机号" />
                </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">角色身份</label>
                <select value={regData.role} onChange={e => setRegData({...regData, role: e.target.value as Role})} className="w-full p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none bg-white">
                   <option value={Role.VILLAGER}>普通村民</option>
                   <option value={Role.ORGANIZER}>赛事组织者</option>
                   <option value={Role.ADMIN}>管理员 (需后台设置)</option>
                </select>
             </div>
             <p className="text-xs text-orange-500 mt-2">* 所有新用户注册后均需等待管理员审核。</p>
             <button type="submit" disabled={loading} className="w-full bg-village-green text-white p-2 rounded-lg font-bold hover:bg-green-700 mt-2">
               {loading ? '注册中...' : '立即注册'}
             </button>
             <button type="button" onClick={() => setIsRegister(false)} className="w-full text-sm text-gray-500 hover:text-green-600 mt-2">
               已有账号？去登录
             </button>
          </form>
        ) : (
          /* Login Form */
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <i className="fas fa-user"></i>
                </span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  placeholder="请输入用户名"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                  <i className="fas fa-lock"></i>
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                  placeholder="请输入密码"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-village-green text-white p-3 rounded-lg font-bold hover:bg-green-700 transform hover:scale-[1.02] transition-all disabled:opacity-50 shadow-lg"
            >
              {loading ? '验证中...' : '登录'}
            </button>
            
            <div className="mt-4 text-center">
              <button type="button" onClick={() => setIsRegister(true)} className="text-sm text-green-600 font-medium hover:underline">
                没有账号？注册新用户
              </button>
              <div className="mt-4 text-xs text-gray-400">
                <p>官方演示:</p>
                <p>org_committee / 123 (村委会)</p>
                <p>admin / 123 (管理员)</p>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const DashboardView = ({ user }: { user: User }) => {
  const [stats, setStats] = useState<{name: string, value: number}[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    ApiService.getParticipationStats()
      .then(setStats)
      .catch(err => console.error("Failed to fetch stats", err));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in relative">
      <header className="mb-8 flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-bold text-gray-800">欢迎回来, {user.realName}!</h2>
           <p className="text-gray-500">这是今天{user.villageName}正在发生的事情。</p>
        </div>
        <button 
          onClick={() => setShowGuide(true)}
          className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm flex items-center hover:bg-gray-900 shadow-lg"
        >
          <i className="fas fa-code mr-2"></i> 后端部署指南
        </button>
      </header>

      {showGuide && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowGuide(false)}>
              <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-2xl font-bold text-gray-800">🚀 Node.js + MySQL 后端部署指南</h3>
                      <button onClick={() => setShowGuide(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times text-xl"></i></button>
                  </div>
                  <div className="prose prose-sm text-gray-600 space-y-4">
                      <p>既然您使用 VS Code 和 Navicat，请按照以下步骤启动真实的后端服务：</p>
                      
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="font-bold text-gray-800 mb-2">1. 准备数据库 (Navicat)</h4>
                          <ol className="list-decimal pl-5 space-y-1">
                              <li>在 Navicat 中连接本地 MySQL。</li>
                              <li>新建数据库 <code className="bg-gray-200 px-1 rounded">village_sports</code> (字符集 utf8mb4)。</li>
                              <li>执行之前提供的 SQL 建表语句 (sys_user, event_info 等表)。</li>
                          </ol>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="font-bold text-gray-800 mb-2">2. 安装依赖 (VS Code 终端)</h4>
                          <p>在项目根目录下打开终端，运行：</p>
                          <pre className="bg-gray-800 text-green-400 p-3 rounded mt-2 text-xs overflow-x-auto">npm install express mysql2 cors body-parser</pre>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                          <h4 className="font-bold text-gray-800 mb-2">3. 启动后端服务</h4>
                          <p>在终端运行以下命令：</p>
                          <pre className="bg-gray-800 text-green-400 p-3 rounded mt-2 text-xs overflow-x-auto">node server.js</pre>
                          <p className="mt-2 text-xs text-blue-600">服务将在 <code className="bg-blue-50 px-1">http://localhost:3001</code> 启动。</p>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                          <h4 className="font-bold text-yellow-800 mb-1">⚠️ 数据库配置</h4>
                          <p className="text-xs">请确保根目录下的 <code className="font-bold">db.js</code> 文件中的 MySQL 密码与您本地一致（默认为 123）。</p>
                      </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                      <button onClick={() => setShowGuide(false)} className="bg-village-green text-white px-6 py-2 rounded-lg">我已了解</button>
                  </div>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 rounded-full bg-blue-50 text-blue-500">
            <i className="fas fa-users text-2xl"></i>
          </div>
          <div>
            <p className="text-sm text-gray-500">活跃村民</p>
            <p className="text-2xl font-bold">1,240</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 rounded-full bg-orange-50 text-orange-500">
            <i className="fas fa-trophy text-2xl"></i>
          </div>
          <div>
            <p className="text-sm text-gray-500">本月赛事</p>
            <p className="text-2xl font-bold">8</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
          <div className="p-4 rounded-full bg-purple-50 text-purple-500">
            <i className="fas fa-hand-holding-heart text-2xl"></i>
          </div>
          <div>
            <p className="text-sm text-gray-500">捐赠物资</p>
            <p className="text-2xl font-bold">342</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border border-gray-100">
        <h3 className="text-xl font-bold mb-6">赛事热度 (按主题)</h3>
        {stats.length > 0 ? (
            <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fill: '#6b7280'}} axisLine={false} tickLine={false} />
                <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}}
                    cursor={{fill: '#f3f4f6'}}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#2E7D32' : '#81C784'} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
            </div>
        ) : (
            <div className="h-80 w-full flex items-center justify-center text-gray-400">
                暂无赛事数据
            </div>
        )}
      </div>
    </div>
  );
};

const EventsView = ({ user }: { user: User }) => {
  const [events, setEvents] = useState<EventInfo[]>([]);
  const [filter, setFilter] = useState<'all' | 'recommended'>('all');
  //const [aiPrompt, setAiPrompt] = useState('');
  //const [aiResponse, setAiResponse] = useState('');
  
  // Create/Edit Event State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState<number | null>(null); // Track if editing
  const [newEvent, setNewEvent] = useState({
      title: '',
      time: '',
      location: '',
      rule: '',
      theme: ''
  });

  useEffect(() => {
    if (filter === 'all') {
      ApiService.getEvents().then(setEvents);
    } else {
      ApiService.getRecommendedEvents(user.id).then(setEvents);
    }
  }, [filter, user.id]);

  const handleRegister = async (eventId: number) => {
    try {
        const success = await ApiService.registerEvent(eventId, user.id, "健康");
        if (success) {
            alert("报名成功！");
            // refresh
            ApiService.getEvents().then(setEvents);
        }
    } catch (e: any) {
        alert(e.message || "报名失败");
    }
  };

  /*const handleAiConsult = async () => {
    if(!aiPrompt) return;
    setAiResponse("思考中...");
    const res = await consultSportsExpert(aiPrompt);
    setAiResponse(res);
  };*/
  
  const handlePublishOrUpdateEvent = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (editingEventId) {
            // Update mode
            await ApiService.updateEvent(editingEventId, {
                ...newEvent,
                organizerId: user.id
            });
            alert('赛事修改成功！');
        } else {
            // Create mode
            await ApiService.createEvent({
                ...newEvent,
                organizerId: user.id,
                organizerName: user.realName
            });
            alert('赛事发布成功！');
        }
        
        setShowCreateForm(false);
        setEditingEventId(null);
        setNewEvent({ title: '', time: '', location: '', rule: '', theme: '' });
        ApiService.getEvents().then(setEvents);
      } catch(e: any) {
          alert((editingEventId ? '修改' : '发布') + '失败: ' + e.message);
      }
  };

  const openCreateModal = () => {
      setEditingEventId(null);
      setNewEvent({ title: '', time: '', location: '', rule: '', theme: '' });
      setShowCreateForm(true);
  };

  const openEditModal = (event: EventInfo) => {
      setEditingEventId(event.id);
      // Format time for datetime-local input (YYYY-MM-DDThh:mm)
      // Assuming event.time comes from DB as '2024-06-15 09:00:00' or ISO string
      let timeStr = event.time;
      try {
          // If it's standard ISO or SQL format, just ensuring 'T' is there and seconds are removed for input
          const dateObj = new Date(event.time);
          // Adjust for timezone offset for local input
          const offset = dateObj.getTimezoneOffset() * 60000;
          const localISOTime = (new Date(dateObj.getTime() - offset)).toISOString().slice(0, 16);
          timeStr = localISOTime;
      } catch (e) {
          // Fallback if parsing fails, try primitive string replacement
          timeStr = event.time.replace(' ', 'T').slice(0, 16);
      }

      setNewEvent({
          title: event.title,
          time: timeStr,
          location: event.location,
          rule: event.rule,
          theme: event.theme
      });
      setShowCreateForm(true);
  };

  const handleDeleteEvent = async (eventId: number) => {
      if (window.confirm('确定要删除这个赛事吗？该操作不可撤销。')) {
          try {
              await ApiService.deleteEvent(eventId);
              alert('删除成功');
              ApiService.getEvents().then(setEvents);
          } catch(e: any) {
              alert('删除失败: ' + e.message);
          }
      }
  };

  const isOrganizer = user.role === Role.ORGANIZER || user.role === Role.ADMIN;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h2 className="text-3xl font-bold text-gray-800">赛事活动</h2>
           <p className="text-gray-500">发现并参与本地体育活动</p>
        </div>
        <div className="flex items-center space-x-2">
            {isOrganizer && (
                <button 
                  onClick={openCreateModal}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 shadow-sm"
                >
                  <i className="fas fa-plus mr-2"></i>发布赛事
                </button>
            )}
            <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-200">
              <button 
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${filter === 'all' ? 'bg-village-green text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                所有赛事
              </button>
              <button 
                onClick={() => setFilter('recommended')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center space-x-2 ${filter === 'recommended' ? 'bg-village-green text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                <i className="fas fa-magic text-xs"></i>
                <span>为您推荐</span>
              </button>
            </div>
        </div>
      </div>

      {showCreateForm && (
          <div className="bg-white p-6 rounded-xl shadow-lg border border-blue-100 animate-fade-in mb-6">
              <h3 className="text-xl font-bold text-blue-800 mb-4">{editingEventId ? '修改赛事信息' : '发布新赛事'}</h3>
              <form onSubmit={handlePublishOrUpdateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">赛事名称</label>
                      <input required value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} className="w-full border p-2 rounded mt-1" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">比赛时间</label>
                      <input required type="datetime-local" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full border p-2 rounded mt-1" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">地点</label>
                      <input required value={newEvent.location} onChange={e => setNewEvent({...newEvent, location: e.target.value})} className="w-full border p-2 rounded mt-1" />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">公益主题</label>
                      <input required value={newEvent.theme} onChange={e => setNewEvent({...newEvent, theme: e.target.value})} className="w-full border p-2 rounded mt-1" />
                  </div>
                  <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700">比赛规则</label>
                      <textarea required value={newEvent.rule} onChange={e => setNewEvent({...newEvent, rule: e.target.value})} className="w-full border p-2 rounded mt-1 h-20" />
                  </div>
                  <div className="col-span-2 flex justify-end gap-2">
                      <button type="button" onClick={() => setShowCreateForm(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">取消</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">{editingEventId ? '保存修改' : '确认发布'}</button>
                  </div>
              </form>
          </div>
      )}

        {/* AI Assistant for Villagers */}
        {/* <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-100 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="font-bold text-indigo-800 mb-2 flex items-center">
            <i className="fas fa-robot mr-2"></i> AI 体育顾问
          </h3>
          <div className="flex gap-2">
            <input 
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="咨询比赛规则、健康建议或活动详情..."
              className="flex-1 p-2 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 outline-none"
            />
            <button onClick={handleAiConsult} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700">提问</button>
          </div>
          {aiResponse && (
            <div className="mt-3 bg-white p-3 rounded-lg border border-indigo-100 text-sm text-gray-700 shadow-sm animate-fade-in">
              {aiResponse}
            </div>
          )}
        </div>
      </div>
        */}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(event => (
          <div key={event.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group relative">
            
            {/* Admin/Organizer Edit/Delete Controls */}
            {isOrganizer && (
                <div className="absolute top-2 left-2 z-10 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                        onClick={() => openEditModal(event)} 
                        className="bg-white/90 text-blue-600 p-1.5 rounded shadow hover:bg-blue-50" 
                        title="编辑"
                    >
                        <i className="fas fa-edit"></i>
                    </button>
                    <button 
                        onClick={() => handleDeleteEvent(event.id)} 
                        className="bg-white/90 text-red-600 p-1.5 rounded shadow hover:bg-red-50" 
                        title="删除"
                    >
                        <i className="fas fa-trash-alt"></i>
                    </button>
                </div>
            )}

            <div className="h-48 overflow-hidden relative">
              <img src={event.imgUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs font-bold text-gray-700 shadow-sm">
                {translateEventStatus(event.status)}
              </div>
            </div>
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">{event.theme}</span>
                <span className="text-xs text-gray-400"><i className="far fa-clock mr-1"></i>{new Date(event.time).toLocaleDateString()}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{event.title}</h3>
              <p className="text-sm text-gray-500 mb-4 line-clamp-2">{event.rule}</p>
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                  <span><i className="fas fa-user-tag mr-1"></i>{event.organizerName}</span>
                  <span><i className="fas fa-users mr-1"></i>{event.participantsCount || 0}人报名</span>
              </div>
              
              <div className="flex items-center text-sm text-gray-500 mb-4">
                 <i className="fas fa-map-marker-alt w-5 text-gray-400"></i>
                 {event.location}
              </div>

              <button 
                onClick={() => handleRegister(event.id)}
                className="w-full py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                立即报名
              </button>
            </div>
          </div>
        ))}
        {events.length === 0 && (
            <div className="col-span-full py-10 text-center text-gray-400">
                暂无赛事活动 (请确保数据库有数据或API连接正常)
            </div>
        )}
      </div>
    </div>
  );
};

const MaterialsView = ({ user }: { user: User }) => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [tab, setTab] = useState<'browse' | 'donate'>('browse');
  
  // Form State
  const [donateName, setDonateName] = useState('');
  const [donateType, setDonateType] = useState<MaterialType>(MaterialType.EQUIPMENT);
  const [donateCond, setDonateCond] = useState(5);

  useEffect(() => {
    ApiService.getMaterials().then(setMaterials);
  }, []);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        await ApiService.donateMaterial({
            name: donateName,
            type: donateType,
            conditionLevel: donateCond,
            donorId: user.id
        });
        alert("捐赠申请已提交，等待审核！");
        setDonateName('');
        // Refresh list
        ApiService.getMaterials().then(setMaterials);
        setTab('browse');
    } catch (e: any) {
        alert("捐赠失败: " + e.message);
    }
  };

  const handleBorrow = async (id: number) => {
    try {
        const success = await ApiService.borrowMaterial(id, user.id, 7);
        if (success) {
            alert("物资借用成功！");
            ApiService.getMaterials().then(setMaterials);
        }
    } catch (e: any) {
        alert("无法借用该物资: " + e.message);
    }
  };

  const handleReturn = async (id: number) => {
      try {
          const success = await ApiService.returnMaterial(id);
          if (success) {
              alert("物资归还成功！");
              ApiService.getMaterials().then(setMaterials);
          }
      } catch (e: any) {
          alert("归还失败: " + e.message);
      }
  };

  // Only villagers can borrow items
  const canBorrow = user.role === Role.VILLAGER;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-3xl font-bold text-gray-800">物资管理</h2>
           <p className="text-gray-500">共享资源，减少浪费</p>
        </div>
        <div className="flex space-x-2">
           <button onClick={() => setTab('browse')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'browse' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border'}`}>浏览</button>
           <button onClick={() => setTab('donate')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'donate' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border'}`}>捐赠物资</button>
        </div>
      </div>

      {tab === 'donate' ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold mb-4">捐赠物资</h3>
          <form onSubmit={handleDonate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">物资名称</label>
              <input value={donateName} onChange={e => setDonateName(e.target.value)} className="w-full border p-2 rounded mt-1" required placeholder="如：篮球、羽毛球拍" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">类型</label>
              <select value={donateType} onChange={e => setDonateType(e.target.value as MaterialType)} className="w-full border p-2 rounded mt-1">
                <option value={MaterialType.EQUIPMENT}>器材</option>
                <option value={MaterialType.CLOTHING}>服装</option>
                <option value={MaterialType.OTHER}>其他</option>
              </select>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700">成色 (1-5)</label>
               <input type="range" min="1" max="5" value={donateCond} onChange={e => setDonateCond(Number(e.target.value))} className="w-full mt-1" />
               <div className="flex justify-between text-xs text-gray-400">
                 <span>旧</span><span>新</span>
               </div>
            </div>
            <button type="submit" className="w-full bg-village-green text-white p-2 rounded hover:bg-green-700">提交捐赠</button>
          </form>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">物资</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">成色</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {materials.map(mat => (
                <tr key={mat.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{mat.name}</div>
                    <div className="text-xs text-gray-500">捐赠人: {mat.donorName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{translateMaterialType(mat.type as MaterialType)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex text-yellow-400 text-xs">
                       {[...Array(mat.conditionLevel)].map((_, i) => <i key={i} className="fas fa-star"></i>)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${mat.status === 'IN_STOCK' ? 'bg-green-100 text-green-800' : 
                        mat.status === 'BORROWED' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {translateMaterialStatus(mat.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {mat.status === 'IN_STOCK' && canBorrow && (
                       <button onClick={() => handleBorrow(mat.id)} className="text-indigo-600 hover:text-indigo-900">借用</button>
                    )}
                    {mat.status === 'BORROWED' && mat.currentHolderId === user.id && (
                        <button onClick={() => handleReturn(mat.id)} className="text-green-600 hover:text-green-900 ml-2">归还</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const CommunityView = ({ user }: { user: User }) => {
  const [activeTab, setActiveTab] = useState<'notice' | 'board' | 'consult'>('notice');
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  
  // Input states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null); // Track if editing a notice/post

  const fetchInteractions = () => {
    let types: InteractionType[] = [];
    if (activeTab === 'notice') types = [InteractionType.NOTICE];
    else if (activeTab === 'board') types = [InteractionType.BOARD];
    else if (activeTab === 'consult') types = [InteractionType.CONSULT];
    
    ApiService.getInteractions(types).then(setInteractions);
  };

  useEffect(() => {
    fetchInteractions();
    // Reset forms when tab changes
    resetForm();
  }, [activeTab]);

  const resetForm = () => {
    setTitle('');
    setContent('');
    setReplyText('');
    setReplyingTo(null);
    setEditingId(null);
  };

  const handleSubmit = async () => {
     let type = InteractionType.CONSULT;
     if (activeTab === 'board') type = InteractionType.BOARD;
     if (activeTab === 'notice') type = InteractionType.NOTICE;

     try {
        if (editingId) {
            await ApiService.updateInteraction(editingId, { title, content });
            alert("修改成功！");
        } else {
            await ApiService.addInteraction({
                userId: user.id,
                userName: user.realName,
                userRole: user.role,
                type: type,
                title: title,
                content: content
            });
            alert("发布成功！");
        }
        resetForm();
        fetchInteractions();
     } catch (e: any) {
         alert((editingId ? "修改" : "发布") + "失败: " + e.message);
     }
  };

  const handleReply = async (id: number) => {
    try {
        await ApiService.replyInteraction(id, replyText);
        alert("回复成功！");
        setReplyText('');
        setReplyingTo(null);
        fetchInteractions();
    } catch (e: any) {
        alert("回复失败: " + e.message);
    }
  };
  
  const handleDelete = async (id: number) => {
      if (window.confirm('确定要删除这条内容吗？')) {
          try {
            await ApiService.deleteInteraction(id);
            fetchInteractions();
            if (editingId === id) resetForm();
          } catch(e: any) {
              alert("删除失败: " + e.message);
          }
      }
  };

  const handleEdit = (item: Interaction) => {
      setEditingId(item.id);
      setTitle(item.title || '');
      setContent(item.content);
      // Optional: Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canPostBoard = user.role === Role.ADMIN || user.role === Role.ORGANIZER;
  const canReply = user.role === Role.ADMIN || user.role === Role.ORGANIZER;
  const isAdmin = user.role === Role.ADMIN;

  // Determine if the form should be shown based on tab and role
  const showForm = 
    (activeTab === 'notice' && isAdmin) ||
    (activeTab === 'board' && canPostBoard) ||
    (activeTab === 'consult' && user.role === Role.VILLAGER);

  const formTitle = 
    activeTab === 'notice' ? (editingId ? '修改系统公告' : '发布系统公告') :
    activeTab === 'board' ? (editingId ? '修改公告/倡议' : '发布新公告/倡议') :
    '我要提问';

  return (
    <div className="space-y-6">
        <header className="flex justify-between items-center">
            <div>
               <h2 className="text-3xl font-bold text-gray-800">互动社区</h2>
               <p className="text-gray-500">获取最新资讯，参与社区交流</p>
            </div>
            <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-200">
               <button onClick={() => setActiveTab('notice')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'notice' ? 'bg-village-green text-white' : 'text-gray-600'}`}>系统公告</button>
               <button onClick={() => setActiveTab('board')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'board' ? 'bg-village-green text-white' : 'text-gray-600'}`}>留言板</button>
               <button onClick={() => setActiveTab('consult')} className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'consult' ? 'bg-village-green text-white' : 'text-gray-600'}`}>咨询与互动</button>
            </div>
        </header>

        {/* Post/Edit Form */}
        {showForm && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800">{formTitle}</h3>
                    {editingId && (
                        <button onClick={resetForm} className="text-sm text-gray-500 hover:text-gray-700">取消修改</button>
                    )}
                </div>
                
                {(activeTab === 'board' || activeTab === 'notice') && (
                    <input value={title} onChange={e => setTitle(e.target.value)} className="w-full mb-3 p-2 border rounded focus:ring-2 focus:ring-green-500 outline-none" placeholder="标题" />
                )}
                <textarea value={content} onChange={e => setContent(e.target.value)} className="w-full mb-3 p-2 border rounded h-24 focus:ring-2 focus:ring-green-500 outline-none" placeholder={activeTab === 'board' || activeTab === 'notice' ? '正文内容...' : '请输入您的问题...'}></textarea>
                <button onClick={handleSubmit} className="bg-village-green text-white px-6 py-2 rounded hover:bg-green-700 font-bold transition-colors">
                    {editingId ? '保存修改' : '发布'}
                </button>
            </div>
        )}

        <div className="space-y-4">
            {interactions.map(item => (
                <div key={item.id} className={`bg-white p-6 rounded-xl shadow-sm border border-gray-100 relative group ${editingId === item.id ? 'ring-2 ring-green-400' : ''}`}>
                    {/* Controls: Delete (Admin/Owner) & Edit (Admin for Notices/Board) */}
                    <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         {/* Edit Button: Only for Admin on Notices, or Admin/Organizer on Boards if they own it or have rights */}
                         {((isAdmin && activeTab === 'notice') || (canPostBoard && activeTab === 'board' && (isAdmin || item.userId === user.id))) && (
                            <button 
                                onClick={() => handleEdit(item)}
                                className="text-blue-400 hover:text-blue-600 p-2 bg-blue-50 rounded-full"
                                title="编辑"
                            >
                                <i className="fas fa-edit"></i>
                            </button>
                         )}
                         {/* Delete Button */}
                         {(isAdmin || item.userId === user.id) && (
                            <button 
                                onClick={() => handleDelete(item.id)}
                                className="text-red-400 hover:text-red-600 p-2 bg-red-50 rounded-full"
                                title="删除"
                            >
                                <i className="fas fa-trash-alt"></i>
                            </button>
                        )}
                    </div>

                    <div className="flex justify-between items-start mb-2 pr-20">
                        <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-xs text-white ${item.userRole === Role.ADMIN ? 'bg-red-500' : item.userRole === Role.ORGANIZER ? 'bg-blue-500' : 'bg-green-500'}`}>
                                {item.userRole === Role.ADMIN ? '管理员' : item.userRole === Role.ORGANIZER ? '组织者' : '村民'}
                            </span>
                            <span className="font-bold text-gray-800">{item.userName}</span>
                        </div>
                        <span className="text-xs text-gray-400">{new Date(item.createTime).toLocaleString()}</span>
                    </div>
                    
                    {item.title && <h4 className="text-lg font-bold mb-2 text-gray-900">{item.title}</h4>}
                    <p className="text-gray-600 mb-4 whitespace-pre-wrap">{item.content}</p>

                    {/* Reply Section */}
                    {item.replyContent ? (
                         <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-500">
                             <p className="text-xs text-gray-500 font-bold mb-1">官方回复:</p>
                             <p className="text-sm text-gray-700">{item.replyContent}</p>
                         </div>
                    ) : (
                        canReply && activeTab === 'consult' && (
                            <div className="mt-4">
                                {replyingTo === item.id ? (
                                    <div className="flex gap-2">
                                        <input value={replyText} onChange={e => setReplyText(e.target.value)} className="flex-1 border p-2 rounded text-sm" placeholder="输入回复..." />
                                        <button onClick={() => handleReply(item.id)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm">提交</button>
                                        <button onClick={() => setReplyingTo(null)} className="text-gray-500 text-sm px-2">取消</button>
                                    </div>
                                ) : (
                                    <button onClick={() => setReplyingTo(item.id)} className="text-blue-600 text-sm hover:underline">回复</button>
                                )}
                            </div>
                        )
                    )}
                </div>
            ))}
            {interactions.length === 0 && <p className="text-center text-gray-400 py-10">暂无内容</p>}
        </div>
    </div>
  );
};

const AdminView = ({ user }: { user: User }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [activeTab, setActiveTab] = useState<'users' | 'loans'>('loans'); // Default to loans for Organizers

    useEffect(() => {
        // If Admin, fetch users
        if (user.role === Role.ADMIN && activeTab === 'users') {
             ApiService.getUsers().then(setUsers);
        }
        // Fetch materials for Material Management (Admin & Organizer)
        if (activeTab === 'loans') {
            ApiService.getMaterials().then(setMaterials);
        }
    }, [user.role, activeTab]);

    const handleDeleteUser = async (userId: number) => {
        if (window.confirm("确定要删除该用户吗？此操作不可恢复。")) {
            try {
                const success = await ApiService.deleteUser(userId);
                if (success) {
                    setUsers(users.filter(u => u.id !== userId));
                } else {
                    alert("删除失败");
                }
            } catch(e: any) {
                alert("删除失败: " + e.message);
            }
        }
    };

    const handleApproveUser = async (userId: number) => {
        try {
            const success = await ApiService.updateUserStatus(userId, UserStatus.ACTIVE);
            if (success) {
                setUsers(users.map(u => u.id === userId ? { ...u, status: UserStatus.ACTIVE } : u));
                alert("用户审核通过！");
            } else {
                alert("操作失败");
            }
        } catch(e: any) {
            alert("操作失败: " + e.message);
        }
    };

    const handleDeleteMaterial = async (id: number) => {
        if (window.confirm("确定要删除该物资吗？相关记录也会被清除。")) {
            try {
                const success = await ApiService.deleteMaterial(id);
                if (success) {
                    setMaterials(materials.filter(m => m.id !== id));
                    alert("物资删除成功");
                } else {
                    alert("删除失败");
                }
            } catch(e: any) {
                // Show full error message from backend
                alert("删除失败: " + e.message);
            }
        }
    };

    const handleApproveMaterial = async (id: number) => {
        try {
            const success = await ApiService.updateMaterialStatus(id, MaterialStatus.IN_STOCK);
            if (success) {
                setMaterials(materials.map(m => m.id === id ? { ...m, status: MaterialStatus.IN_STOCK } : m));
                alert("物资审核通过，已入库！");
            } else {
                alert("审核失败");
            }
        } catch(e: any) {
            alert("审核失败: " + e.message);
        }
    };

    const handleForceReturn = async (id: number) => {
        if (window.confirm("确定要强制归还该物资吗？这将重置物资状态为“在库”。")) {
            try {
                const success = await ApiService.returnMaterial(id);
                if (success) {
                    setMaterials(materials.map(m => m.id === id ? { ...m, status: MaterialStatus.IN_STOCK, currentHolderId: undefined, holderName: undefined } : m));
                    alert("物资已强制归还！");
                }
            } catch(e: any) {
                alert("操作失败: " + e.message);
            }
        }
    };

    if (user.role !== Role.ADMIN && user.role !== Role.ORGANIZER) return <div className="text-center p-10">无权限访问</div>;

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">管理后台</h2>
                    <p className="text-gray-500">用户审核与系统管理</p>
                </div>
                <div className="flex bg-white p-1 rounded-lg shadow-sm border border-gray-200">
                    {user.role === Role.ADMIN && (
                        <button 
                            onClick={() => setActiveTab('users')} 
                            className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'users' ? 'bg-village-green text-white' : 'text-gray-600'}`}
                        >
                            用户管理
                        </button>
                    )}
                    <button 
                        onClick={() => setActiveTab('loans')} 
                        className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === 'loans' ? 'bg-village-green text-white' : 'text-gray-600'}`}
                    >
                        物资管理
                    </button>
                </div>
            </header>

            {activeTab === 'users' && user.role === Role.ADMIN && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="font-bold text-lg">用户列表</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">账号</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">真实姓名</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">角色</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.map(u => (
                                    <tr key={u.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.id}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.realName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2 py-1 rounded text-xs ${u.role === Role.ADMIN ? 'bg-red-100 text-red-800' : u.role === Role.ORGANIZER ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {u.status === UserStatus.ACTIVE ? (
                                                <span className="text-green-600">正常</span>
                                            ) : u.status === UserStatus.PENDING ? (
                                                <span className="text-orange-500 font-bold">待审核</span>
                                            ) : (
                                                <span className="text-red-500">禁用</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                            {u.id !== user.id && (
                                                <>
                                                    {u.status === UserStatus.PENDING && (
                                                        <button 
                                                            onClick={() => handleApproveUser(u.id)}
                                                            className="text-green-600 hover:text-green-900 font-bold border border-green-200 px-2 py-0.5 rounded bg-green-50"
                                                        >
                                                            通过审核
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleDeleteUser(u.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        删除
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'loans' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-bold text-lg">物资管理与借用情况</h3>
                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">总计 {materials.length} 件</span>
                    </div>
                    {materials.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">物资名称</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">类型</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">捐赠者</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">状态/持有者</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">操作</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {materials.map(m => (
                                        <tr key={m.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{m.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{translateMaterialType(m.type as MaterialType)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{m.donorName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {m.status === MaterialStatus.BORROWED ? (
                                                     <span className="text-yellow-600 font-bold">
                                                         已借出: {m.holderName || (m.currentHolderId ? `ID:${m.currentHolderId}` : '未知用户')}
                                                     </span>
                                                ) : m.status === MaterialStatus.IN_STOCK ? (
                                                    <span className="text-green-600">在库</span>
                                                ) : m.status === MaterialStatus.PENDING ? (
                                                    <span className="text-orange-500 font-bold">审核中</span>
                                                ) : (
                                                    <span className="text-gray-500">{translateMaterialStatus(m.status)}</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                                {m.status === MaterialStatus.PENDING && (
                                                    <button 
                                                        onClick={() => handleApproveMaterial(m.id)}
                                                        className="text-green-600 hover:text-green-900 font-bold border border-green-200 bg-green-50 px-3 py-1 rounded hover:bg-green-100 transition-colors"
                                                    >
                                                        通过审核
                                                    </button>
                                                )}
                                                {m.status === MaterialStatus.BORROWED && (
                                                    <button 
                                                        onClick={() => handleForceReturn(m.id)}
                                                        className="text-orange-600 hover:text-orange-900 border border-orange-200 bg-orange-50 px-3 py-1 rounded hover:bg-orange-100 transition-colors"
                                                        title="强制归还：重置物资状态"
                                                    >
                                                        强制归还
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleDeleteMaterial(m.id)}
                                                    className="text-red-600 hover:text-red-900 border border-red-200 bg-red-50 px-3 py-1 rounded hover:bg-red-100 transition-colors"
                                                >
                                                    删除
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-10 text-center text-gray-400">
                            暂无物资数据
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const App: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [currentView, setCurrentView] = useState('dashboard');
    const [isLoading, setIsLoading] = useState(true); // 添加一个加载状态

    // 这个效应只在应用首次加载时运行一次
    useEffect(() => {
        try {
            // 尝试从 localStorage 读取已保存的用户信息
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
                // 如果找到了，就解析它并设置为当前用户
                setUser(JSON.parse(storedUser));
            }
        } catch (error) {
            console.error("从localStorage读取用户信息失败", error);
            // 如果出错了，就清空它
            localStorage.removeItem('user');
        } finally {
            // 无论成功与否，都结束加载状态
            setIsLoading(false);
        }
    }, []); // 空依赖数组 [] 保证这个 effect 只运行一次

    // 登录处理函数
    const handleLogin = (loggedInUser: User) => {
        // 1. 将用户信息保存到 localStorage
        localStorage.setItem('user', JSON.stringify(loggedInUser));
        // 2. 更新组件的 state
        setUser(loggedInUser);
        setCurrentView('dashboard');
    };

    // 登出处理函数
    const handleLogout = () => {
        // 1. 从 localStorage 中移除用户信息
        localStorage.removeItem('user');
        // 2. 清空组件的 state
        setUser(null);
    };

    // 在检查本地存储时，显示一个加载指示器，防止闪烁
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100">
                <p className="text-gray-500">正在加载...</p>
            </div>
        );
    }

    // 如果没有用户登录，显示登录界面
    if (!user) {
        return <LoginView onLogin={handleLogin} />;
    }

    // 如果用户已登录，显示主布局
    return (
        <Layout
            user={user}
            onLogout={handleLogout}
            currentView={currentView}
            onNavigate={setCurrentView}
        >
            <DbStatus />
            {(() => {
                switch (currentView) {
                    case 'dashboard': return <DashboardView user={user} />;
                    case 'events': return <EventsView user={user} />;
                    case 'materials': return <MaterialsView user={user} />;
                    case 'community': return <CommunityView user={user} />;
                    case 'admin': return <AdminView user={user} />;
                    default: return <DashboardView user={user} />;
                }
            })()}
        </Layout>
    );
};
export default App;