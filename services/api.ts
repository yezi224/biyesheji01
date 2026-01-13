import { User, EventInfo, Material, Interaction, InteractionType, EventStatus, UserStatus, MaterialStatus } from '../types';

const API_BASE_URL = '/api';

// Helper to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Request failed with status ${response.status}`;
    try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) errorMessage = errorJson.message;
        else if (errorJson.error) errorMessage = errorJson.error;
    } catch (e) {
        // use raw text if not json
        if (errorText) errorMessage = errorText;
    }
    throw new Error(errorMessage);
  }
  
  // Handle empty responses (like 200 OK with no body)
  const text = await response.text();
  return text ? JSON.parse(text) : {} as T;
}

export const ApiService = {
  // --- System ---
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

  // --- Users ---
  login: async (username: string, password?: string): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    return handleResponse<User>(res);
  },

  register: async (userData: Partial<User> & { password?: string }): Promise<User> => {
    const res = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return handleResponse<User>(res);
  },

  getUsers: async (): Promise<User[]> => {
    const res = await fetch(`${API_BASE_URL}/users`);
    return handleResponse<User[]>(res);
  },

  updateUserStatus: async (userId: number, status: UserStatus): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.ok;
  },

  deleteUser: async (userId: number): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/users/${userId}`, { method: 'DELETE' });
    return res.ok;
  },

  // --- Events ---
  getEvents: async (): Promise<EventInfo[]> => {
    const res = await fetch(`${API_BASE_URL}/events`);
    return handleResponse<EventInfo[]>(res);
  },

  getRecommendedEvents: async (userId: number): Promise<EventInfo[]> => {
    const res = await fetch(`${API_BASE_URL}/events/recommend?userId=${userId}`);
    return handleResponse<EventInfo[]>(res);
  },

  createEvent: async (eventData: Partial<EventInfo>): Promise<EventInfo> => {
    const res = await fetch(`${API_BASE_URL}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    return handleResponse<EventInfo>(res);
  },

  updateEvent: async (eventId: number, eventData: Partial<EventInfo>): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });
    return res.ok;
  },

  deleteEvent: async (eventId: number): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}`, { method: 'DELETE' });
    return res.ok;
  },

  registerEvent: async (eventId: number, userId: number, healthDeclare: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/events/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, healthDeclare })
    });
    return res.ok;
  },

  // --- Materials ---
  getMaterials: async (): Promise<Material[]> => {
    const res = await fetch(`${API_BASE_URL}/materials`);
    return handleResponse<Material[]>(res);
  },

  donateMaterial: async (material: Omit<Material, 'id' | 'status' | 'donorName'>): Promise<Material> => {
    const res = await fetch(`${API_BASE_URL}/materials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(material)
    });
    return handleResponse<Material>(res);
  },

  borrowMaterial: async (materialId: number, userId: number, days: number): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/materials/${materialId}/borrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, days })
    });
    return res.ok;
  },

  returnMaterial: async (materialId: number): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/materials/${materialId}/return`, {
        method: 'POST'
    });
    return res.ok;
  },

  updateMaterialStatus: async (id: number, status: MaterialStatus): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/materials/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.ok;
  },

  deleteMaterial: async (id: number): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/materials/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // --- Interactions ---
  getInteractions: async (types?: InteractionType[]): Promise<Interaction[]> => {
    const query = types ? `?types=${types.join(',')}` : '';
    const res = await fetch(`${API_BASE_URL}/interactions${query}`);
    return handleResponse<Interaction[]>(res);
  },

  addInteraction: async (interaction: Omit<Interaction, 'id' | 'createTime'>): Promise<Interaction> => {
    const res = await fetch(`${API_BASE_URL}/interactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(interaction)
    });
    return handleResponse<Interaction>(res);
  },

  updateInteraction: async (id: number, data: {title?: string, content: string}): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/interactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  },

  replyInteraction: async (id: number, replyContent: string): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/interactions/${id}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ replyContent })
    });
    return res.ok;
  },

  deleteInteraction: async (id: number): Promise<boolean> => {
    const res = await fetch(`${API_BASE_URL}/interactions/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // --- Statistics ---
  getParticipationStats: async (): Promise<{name: string, value: number}[]> => {
    const res = await fetch(`${API_BASE_URL}/stats/participation`);
    return handleResponse<{name: string, value: number}[]>(res);
  }
};