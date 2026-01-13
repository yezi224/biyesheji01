import { User, Role, UserStatus, EventInfo, EventStatus, EventRegistration, Material, MaterialStatus, MaterialRecord, Interaction, InteractionType } from '../types';

// --- API Configuration ---
// Changed to relative path so requests go through Vite proxy -> localhost:3001
const API_BASE_URL = '/api'; 

// --- Mock Data (Fallback) ---
// Used when the backend database is offline
// Added password field internally for mock authentication
const MOCK_USERS: (User & { password?: string })[] = [
  { id: 1, username: 'admin', password: '123', realName: '李村长', role: Role.ADMIN, villageName: '幸福村', status: UserStatus.ACTIVE },
  { id: 2, username: 'org_zhang', password: '123', realName: '张三体育协会', role: Role.ORGANIZER, villageName: '柳林村', status: UserStatus.ACTIVE },
  { id: 3, username: 'villager_li', password: '123', realName: '李大壮', role: Role.VILLAGER, villageName: '柳林村', exercisePref: '篮球,跑步', status: UserStatus.ACTIVE },
  { id: 4, username: 'villager_wang', password: '123', realName: '王翠花', role: Role.VILLAGER, villageName: '青山镇', exercisePref: '羽毛球,跳舞', status: UserStatus.ACTIVE },
  // New Official Account
  { id: 5, username: 'org_committee', password: '123', realName: '村委会官方', role: Role.ORGANIZER, villageName: '幸福村', status: UserStatus.ACTIVE },
];

const MOCK_EVENTS: EventInfo[] = [
  { id: 1, title: '柳林村夏季篮球友谊赛', organizerId: 2, organizerName: '张三体育协会', rule: '5v5全场，单场淘汰制', time: '2024-08-15 09:00:00', location: '村委会广场篮球场', theme: '强身健体，共建和谐', status: EventStatus.OPEN, imgUrl: 'https://picsum.photos/seed/basketball/800/400', participantsCount: 15 },
  { id: 2, title: '青山镇全民健步走', organizerId: 2, organizerName: '张三体育协会', rule: '环绕青山湖一周，约5公里', time: '2024-08-20 07:30:00', location: '青山湖公园入口', theme: '绿色生活，健康同行', status: EventStatus.OPEN, imgUrl: 'https://picsum.photos/seed/walking/800/400', participantsCount: 45 },
];

const MOCK_MATERIALS: Material[] = [
  { id: 1, name: '专业篮球', type: '器材', conditionLevel: 4, donorId: 3, donorName: '李大壮', status: MaterialStatus.IN_STOCK },
  { id: 2, name: '运动套装', type: '服装', conditionLevel: 5, donorId: 4, donorName: '王翠花', status: MaterialStatus.PENDING },
  { id: 3, name: '羽毛球拍(副)', type: '器材', conditionLevel: 3, donorId: 5, donorName: '赵铁柱', status: MaterialStatus.BORROWED, currentHolderId: 3 },
];

const MOCK_INTERACTIONS: Interaction[] = [
    { id: 1, userId: 1, userName: '李村长', userRole: Role.ADMIN, type: InteractionType.NOTICE, title: '物资申请进度公示', content: '本月第一批申请的篮球架已发货。', createTime: '2024-05-20T09:00:00' },
    { id: 2, userId: 3, userName: '李大壮', userRole: Role.VILLAGER, type: InteractionType.CONSULT, content: '请问篮球赛需要自己带球吗？', createTime: '2024-05-21T16:00:00', replyContent: '现场提供比赛用球，热身球建议自备。' },
];

// --- Helper for Fetching with Fallback ---
async function fetchWithFallback<T>(endpoint: string, options: RequestInit = {}, fallbackData: T): Promise<T> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            headers: { 'Content-Type': 'application/json' },
            ...options
        });
        if (!response.ok) {
            throw new Error(`API Error ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`🔴 [API FAIL] ${endpoint}`, error);
        console.warn(`⚠️ Switching to Mock Data for ${endpoint}`);
        return fallbackData; // Return mock data so the app doesn't break
    }
}

// --- Service Layer ---

export const MockBackend = {
  // Check Health
  checkHealth: async (): Promise<boolean> => {
      try {
          const res = await fetch(`${API_BASE_URL}/health`);
          if (res.ok) {
              const data = await res.json();
              return data.status === 'ok';
          }
          return false;
      } catch (e) {
          return false;
      }
  },

  // 1. User Service
  login: async (username: string, password?: string): Promise<User> => {
    // API: POST /api/users/login (Body: { username, password })
    try {
        const response = await fetch(`${API_BASE_URL}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (response.ok) return await response.json();
        
        // If 401 (Unauthorized), throw error explicitly so we don't fallback to mock login on bad password
        if (response.status === 401) {
            throw new Error("账号或密码错误"); 
        }
        
        throw new Error("Login failed");
    } catch (e: any) {
        // If it's a specific auth error, rethrow it
        if (e.message === "账号或密码错误") throw e;

        console.warn("[Backend Offline] Simulating login...");
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            // In mock mode, check username AND password (if provided)
            const user = MOCK_USERS.find(u => u.username === username);
            if (user) {
                if (password && user.password && user.password !== password) {
                    reject(new Error('密码错误 (Mock)'));
                } else {
                    resolve(user);
                }
            } else {
                reject(new Error('账号不存在 (Mock)'));
            }
          }, 800);
        });
    }
  },

  register: async (userData: Partial<User> & { password?: string }): Promise<User> => {
      try {
        const response = await fetch(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        if (response.ok) return await response.json();
        throw new Error("Registration failed");
      } catch (e) {
          console.warn("[Backend Offline] Simulating registration...");
          return new Promise((resolve) => {
              setTimeout(() => {
                  const newUser: User & { password?: string } = {
                      id: Date.now(),
                      username: userData.username || 'user',
                      password: userData.password,
                      realName: userData.realName || '新用户',
                      role: userData.role || Role.VILLAGER,
                      villageName: userData.villageName || '未知村庄',
                      phone: userData.phone,
                      status: userData.role === Role.ORGANIZER ? UserStatus.PENDING : UserStatus.ACTIVE
                  };
                  MOCK_USERS.push(newUser);
                  resolve(newUser);
              }, 800);
          });
      }
  },

  getUsers: async (): Promise<User[]> => {
      return fetchWithFallback('/users', {}, MOCK_USERS);
  },

  deleteUser: async (userId: number): Promise<boolean> => {
      try {
          const res = await fetch(`${API_BASE_URL}/users/${userId}`, { method: 'DELETE' });
          return res.ok;
      } catch (e) {
          console.warn("[Backend Offline] Simulating user deletion...");
          const index = MOCK_USERS.findIndex(u => u.id === userId);
          if (index !== -1) {
              MOCK_USERS.splice(index, 1);
              return true;
          }
          return false;
      }
  },

  // 2. Event Service
  getEvents: async (): Promise<EventInfo[]> => {
    return fetchWithFallback('/events', {}, MOCK_EVENTS);
  },

  createEvent: async (eventData: Partial<EventInfo>): Promise<EventInfo> => {
      try {
          const res = await fetch(`${API_BASE_URL}/events`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(eventData)
          });
          if (res.ok) return await res.json();
          throw new Error("Failed to create event");
      } catch (e) {
          console.warn("[Backend Offline] Simulating event creation...");
          const newEvent: EventInfo = {
              id: Date.now(),
              title: eventData.title || '未命名赛事',
              organizerId: eventData.organizerId || 0,
              organizerName: eventData.organizerName || '未知组织',
              rule: eventData.rule || '',
              time: eventData.time || new Date().toISOString(),
              location: eventData.location || '',
              theme: eventData.theme || '',
              status: EventStatus.OPEN,
              imgUrl: eventData.imgUrl || 'https://picsum.photos/800/400',
              participantsCount: 0
          };
          MOCK_EVENTS.unshift(newEvent);
          return newEvent;
      }
  },

  registerEvent: async (eventId: number, userId: number, healthDeclare: string): Promise<boolean> => {
    try {
        const res = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, healthDeclare })
        });
        return res.ok;
    } catch (e) {
        console.warn("[Backend Offline] Simulating registration...");
        // Update local count for immediate feedback in mock
        const evt = MOCK_EVENTS.find(e => e.id === eventId);
        if (evt) evt.participantsCount = (evt.participantsCount || 0) + 1;
        return true; 
    }
  },

  // 3. Recommendation Service
  getRecommendedEvents: async (userId: number): Promise<EventInfo[]> => {
      // API should return filtered list
      // Fallback: return all open events
      return fetchWithFallback(`/events/recommend?userId=${userId}`, {}, MOCK_EVENTS.filter(e => e.status === EventStatus.OPEN));
  },

  // 4. Material Service
  getMaterials: async (): Promise<Material[]> => {
    return fetchWithFallback('/materials', {}, MOCK_MATERIALS);
  },

  donateMaterial: async (material: Omit<Material, 'id' | 'status' | 'donorName'>): Promise<Material> => {
     try {
         const res = await fetch(`${API_BASE_URL}/materials`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(material)
         });
         if(res.ok) return await res.json();
         throw new Error("Failed to donate");
     } catch (e) {
         console.warn("[Backend Offline] Simulating donation...");
         const newMat = { ...material, id: Date.now(), status: MaterialStatus.PENDING, donorName: '我 (Mock)' } as Material;
         MOCK_MATERIALS.push(newMat);
         return newMat;
     }
  },

  borrowMaterial: async (materialId: number, userId: number, days: number): Promise<boolean> => {
      try {
          const res = await fetch(`${API_BASE_URL}/materials/${materialId}/borrow`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userId, days })
          });
          return res.ok;
      } catch (e) {
          console.warn("[Backend Offline] Simulating borrow...");
          const mat = MOCK_MATERIALS.find(m => m.id === materialId);
          if (mat && mat.status === MaterialStatus.IN_STOCK) {
              mat.status = MaterialStatus.BORROWED;
              return true;
          }
          return false;
      }
  },

  // 5. Interaction Service
  getInteractions: async (types?: InteractionType[]): Promise<Interaction[]> => {
    const query = types ? `?types=${types.join(',')}` : '';
    return fetchWithFallback(`/interactions${query}`, {}, MOCK_INTERACTIONS);
  },

  addInteraction: async (interaction: Omit<Interaction, 'id' | 'createTime'>): Promise<Interaction> => {
    try {
        const res = await fetch(`${API_BASE_URL}/interactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(interaction)
        });
        if(res.ok) return await res.json();
        throw new Error("Failed");
    } catch(e) {
        console.warn("[Backend Offline] Simulating interaction...");
        const newInt = { ...interaction, id: Date.now(), createTime: new Date().toISOString() } as Interaction;
        MOCK_INTERACTIONS.unshift(newInt);
        return newInt;
    }
  },

  replyInteraction: async (id: number, replyContent: string): Promise<boolean> => {
    try {
        const res = await fetch(`${API_BASE_URL}/interactions/${id}/reply`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ replyContent })
        });
        return res.ok;
    } catch (e) {
        console.warn("[Backend Offline] Simulating reply...");
        const item = MOCK_INTERACTIONS.find(i => i.id === id);
        if (item) item.replyContent = replyContent;
        return true;
    }
  },

  deleteInteraction: async (id: number): Promise<boolean> => {
      try {
          const res = await fetch(`${API_BASE_URL}/interactions/${id}`, { method: 'DELETE' });
          return res.ok;
      } catch (e) {
          console.warn("[Backend Offline] Simulating interaction deletion...");
          const index = MOCK_INTERACTIONS.findIndex(i => i.id === id);
          if (index !== -1) {
              MOCK_INTERACTIONS.splice(index, 1);
              return true;
          }
          return false;
      }
  },

  // Analytics for Charts
  getParticipationStats: async () => {
      // In real backend, this would be an aggregation query
      return fetchWithFallback('/stats/participation', {}, [
          { name: '篮球赛', value: 15 },
          { name: '健步走', value: 45 }
      ]);
  }
};