"use client";

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  name: string;
  company?: string;
  phone?: string;
  avatar?: string;
  joinedDate: Date;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateProfile: (userData: Partial<User>) => void;
}

// Mock user database
const mockUsers: Record<string, { email: string; password: string; name: string; company?: string; phone?: string }> = {
  'demo@bzion.com': {
    email: 'demo@bzion.com',
    password: 'demo123',
    name: 'John Doe',
    company: 'ABC Trading Ltd',
    phone: '+234 801 234 5678',
  },
  'test@bzion.com': {
    email: 'test@bzion.com',
    password: 'test123',
    name: 'Jane Smith',
    company: 'XYZ Supply Co',
    phone: '+234 702 987 6543',
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: async (email: string, password: string) => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockUser = mockUsers[email];
        if (mockUser && mockUser.password === password) {
          const user: User = {
            id: `user-${Date.now()}`,
            email: mockUser.email,
            name: mockUser.name,
            company: mockUser.company,
            phone: mockUser.phone,
            joinedDate: new Date(2024, 0, 15),
          };
          set({ user, isAuthenticated: true });
        } else {
          throw new Error('Invalid email or password');
        }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
      },
      updateProfile: (userData) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      merge: (persistedState: any, currentState) => {
        // Convert joinedDate string back to Date object when hydrating from storage
        if (persistedState?.user?.joinedDate && typeof persistedState.user.joinedDate === 'string') {
          persistedState.user.joinedDate = new Date(persistedState.user.joinedDate);
        }
        return { ...currentState, ...persistedState };
      },
    }
  )
);
