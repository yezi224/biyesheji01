// Enums matching DB
export enum Role {
  VILLAGER = 'VILLAGER',
  ORGANIZER = 'ORGANIZER',
  ADMIN = 'ADMIN'
}

export enum UserStatus {
  PENDING = 0,
  ACTIVE = 1,
  BANNED = 2
}

export enum EventStatus {
  OPEN = 'OPEN',
  PROGRESS = 'PROGRESS',
  END = 'END'
}

export enum MaterialStatus {
  PENDING = 'PENDING',
  IN_STOCK = 'IN_STOCK',
  BORROWED = 'BORROWED',
  LOST = 'LOST'
}

export enum MaterialType {
  EQUIPMENT = '器材', // Changed to match DB string values if backend returns Chinese, or map appropriately
  CLOTHING = '服装',
  OTHER = '其他'
}

export enum InteractionType {
  COMMENT = 'COMMENT',
  LIKE = 'LIKE',
  CONSULT = 'CONSULT',
  BOARD = 'BOARD',
  NOTICE = 'NOTICE'
}

// Interfaces matching DB Tables
export interface User {
  id: number;
  username: string;
  realName: string; // Mapped from real_name
  role: Role;
  villageName: string; // Mapped from village_name
  phone?: string;
  exercisePref?: string; // Mapped from exercise_pref
  status: UserStatus;
}

export interface EventInfo {
  id: number;
  title: string;
  organizerId: number; // Mapped from organizer_id
  organizerName?: string; // Likely a DTO field from backend
  rule: string;
  time: string; // ISO Date string
  location: string;
  theme: string;
  status: EventStatus;
  imgUrl: string; // Mapped from img_url
  participantsCount?: number; // Added to match DB participants_count
}

export interface EventRegistration {
  id: number;
  eventId: number;
  userId: number;
  healthDeclare: string;
  createTime: string;
}

export interface Material {
  id: number;
  name: string;
  type: string; // Simplified to string to match DB varchar, or strictly map to Enum
  conditionLevel: number; // 1-5 stars, mapped from condition_level
  donorId: number;
  donorName?: string;
  status: MaterialStatus;
  currentHolderId?: number; // Mapped from current_holder_id
  holderName?: string; // Current borrower's name
}

export interface MaterialRecord {
  id: number;
  materialId: number;
  userId: number;
  actionType: 'DONATE' | 'BORROW' | 'RETURN' | 'APPLY_SUPPORT';
  createTime: string;
  expectedReturnTime?: string;
}

export interface Interaction {
  id: number;
  targetId?: number; // Mapped from target_id
  userId: number; // Mapped from user_id
  userName?: string; // DTO field
  userRole?: Role; // DTO field
  type: InteractionType;
  title?: string; // Optional context title
  content: string;
  replyContent?: string; // Mapped from reply_content
  createTime: string;
}

// UI specific types
export interface NavItem {
  label: string;
  icon: string;
  view: string;
  roles: Role[];
}