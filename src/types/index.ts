import type { Timestamp } from "firebase/firestore";

export interface UserProfile {
  uid: string;
  email: string | null;
  name: string | null;
  familyId?: string;
  photoURL?: string;
  defaultExpensesToPrivate?: boolean;
  defaultEarningsToPrivate?: boolean;
  notificationSound?: string;
  fcmTokens?: string[];
  isFinancialDataHidden?: boolean;
}

export interface Family {
  id: string;
  name:string;
  members: string[]; // array of user uids
  inviteCode: string;
  createdAt: Timestamp;
  currency?: string;
  currencySymbol?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  date: Timestamp;
  addedBy: string; // user uid
  isPrivate: boolean;
  createdAt: Timestamp;
}

export interface Earning {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  date: Timestamp;
  addedBy: string; // user uid
  isPrivate: boolean;
  createdAt: Timestamp;
}

export interface ShoppingItem {
  id: string;
  name: string;
  addedBy: string; // user uid
  purchased: boolean;
  createdAt: Timestamp;
  categoryId?: string;
  quantity?: number;
  unit?: string;
  reminderAt?: Timestamp | null;
  remindedBy?: string | null;
  purchasedBy?: string | null;
}
