import { create } from 'zustand';
import type { User } from '@/types/primitives/User';

interface UserState {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  updateUser: (user: Partial<User>) => void;
  clearUser: () => void;
  setLoading: (loading: boolean) => void;
}

export const useUserStore = create<UserState>()((set) => ({
  user: null,
  isLoading: true,
  setUser: (user) => set({ user, isLoading: false }),
  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : null,
    })),
  clearUser: () => set({ user: null, isLoading: false }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
