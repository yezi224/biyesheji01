
import { User, EventInfo, Material, Interaction, Role, UserStatus, MaterialStatus, MaterialType, InteractionType } from '../types';

// Use an absolute path for the API endpoint
const API_BASE_URL = 'http://localhost:8080/api';

// A helper function to handle API requests and errors
const fetchApi = async (url: string, options: RequestInit = {}) => {
    // The browser will automatically handle session cookies for subsequent requests.
    const headers: Record<string, string> = {
        // Default to JSON content type, can be overridden by the caller.
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
    };
    
    try {
        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            let errorMessage = `Error: ${response.status} ${response.statusText}`;
            try {
                const errorData = await response.json();
                // Use the error message from the backend's JSON response
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                if (response.status === 401) {
                    errorMessage = '认证失败，请检查用户名或密码。';
                }
            }
            throw new Error(errorMessage);
        }
        
        // Handle responses with no content
        if (response.status === 204 || response.headers.get('Content-Length') === '0') {
            return { success: true }; 
        }

        return await response.json();
    } catch (error: any) {
        console.error('API Fetch Error:', error.message);
        throw error;
    }
};

export const ApiService = {
    // --- Authentication ---
    login: async (username: string, password: string): Promise<User> => {
        const body = new URLSearchParams();
        body.append('username', username);
        body.append('password', password);

        // Spring Security's formLogin expects x-www-form-urlencoded
        return fetchApi(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
        });
    },

    logout: () => {
        // Calls the logout endpoint configured in Spring Security
        return fetchApi(`${API_BASE_URL}/logout`, { method: 'POST' });
    },

    checkHealth: async () => {
        try {
            // A simple check against a known endpoint. Spring Boot Actuator's /health would be ideal here.
            const response = await fetch(`${API_BASE_URL}/users/register`, { method: 'OPTIONS' });
            // If we get a response (even an error), the server is likely up.
            return response.ok || response.status >= 400;
        } catch (e) {
            return false;
        }
    },

    // --- User Management ---
    getMe: (): Promise<User> => fetchApi(`${API_BASE_URL}/users/me`),

    register: (regData: Omit<User, 'id' | 'status'>): Promise<User> =>
        fetchApi(`${API_BASE_URL}/users/register`, {
            method: 'POST',
            body: JSON.stringify(regData),
        }),

    getUsers: (): Promise<User[]> => fetchApi(`${API_BASE_URL}/users`),

    updateUserStatus: (userId: number, status: UserStatus): Promise<{ success: boolean }> =>
        fetchApi(`${API_BASE_URL}/users/${userId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }),

    deleteUser: (userId: number): Promise<{ success: boolean }> =>
        fetchApi(`${API_BASE_URL}/users/${userId}`, { method: 'DELETE' }),

    // --- Event Management ---
    getEvents: (): Promise<EventInfo[]> => fetchApi(`${API_BASE_URL}/events`),
    
    getRecommendedEvents: (userId: number): Promise<EventInfo[]> => {
        return ApiService.getEvents().then(events => events.filter(e => e.organizerId !== userId));
    },

    createEvent: (eventData: Omit<EventInfo, 'id' | 'participantsCount' | 'status' | 'imgUrl' | 'organizerName'>): Promise<EventInfo> =>
        fetchApi(`${API_BASE_URL}/events`, {
            method: 'POST',
            body: JSON.stringify(eventData),
        }),

    updateEvent: (eventId: number, eventData: Partial<EventInfo>): Promise<{ success: boolean }> =>
        fetchApi(`${API_BASE_URL}/events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify(eventData),
        }),
        
    deleteEvent: (eventId: number): Promise<{ success: boolean }> =>
        fetchApi(`${API_BASE_URL}/events/${eventId}`, { method: 'DELETE' }),

    registerEvent: (eventId: number, userId: number, healthCondition: string): Promise<{ success: boolean }> =>
        fetchApi(`${API_BASE_URL}/events/${eventId}/register`, {
            method: 'POST',
            body: JSON.stringify({ userId, healthCondition }),
        }),
    
    // --- Stats ---
    getParticipationStats: (): Promise<{ name: string; value: number }[]> => 
        fetchApi(`${API_BASE_URL}/stats/participation`),

    // --- Material Management ---
    getMaterials: (): Promise<Material[]> => fetchApi(`${API_BASE_URL}/materials`),

    donateMaterial: (data: { name: string, type: MaterialType, conditionLevel: number, donorId: number }): Promise<Material> =>
        fetchApi(`${API_BASE_URL}/materials/donate`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    borrowMaterial: (materialId: number, userId: number, duration: number): Promise<{ success: boolean }> =>
        fetchApi(`${API_BASE_URL}/materials/${materialId}/borrow`, {
            method: 'POST',
            body: JSON.stringify({ userId, duration }),
        }),

    returnMaterial: (materialId: number): Promise<{ success: boolean }> =>
        fetchApi(`${API_BASE_URL}/materials/${materialId}/return`, {
            method: 'POST',
        }),

    updateMaterialStatus: (id: number, status: MaterialStatus): Promise<{ success: boolean }> =>
        fetchApi(`${API_BASE_URL}/materials/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        }),

    deleteMaterial: (id: number): Promise<{ success: boolean }> =>
        fetchApi(`${API_BASE_URL}/materials/${id}`, { method: 'DELETE' }),

    // --- Community Management ---
    getInteractions: (types: InteractionType[]): Promise<Interaction[]> => 
        fetchApi(`${API_BASE_URL}/interactions?types=${types.join(',')}`),

    addInteraction: (data: Omit<Interaction, 'id' | 'createTime'>): Promise<{ id: number }> =>
        fetchApi(`${API_BASE_URL}/interactions`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    replyInteraction: (id: number, replyContent: string): Promise<{ success: boolean }> =>
        fetchApi(`${API_BASE_URL}/interactions/${id}/reply`, {
            method: 'POST',
            body: JSON.stringify({ replyContent }),
        }),

    updateInteraction: (id: number, data: { title?: string, content: string }): Promise<{ success: boolean }> =>
        fetchApi(`${API_BASE_URL}/interactions/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    deleteInteraction: (id: number): Promise<{ success: boolean }> =>
        fetchApi(`${API_BASE_URL}/interactions/${id}`, { method: 'DELETE' }),
};
