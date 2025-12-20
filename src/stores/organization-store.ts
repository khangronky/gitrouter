import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const STORAGE_KEY = 'gitrouter:currentOrgId';

interface OrganizationState {
  currentOrgId: string | null;
  isInitialized: boolean;
  setCurrentOrg: (orgId: string | null) => void;
  clearCurrentOrg: () => void;
  setInitialized: (initialized: boolean) => void;
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      currentOrgId: null,
      isInitialized: false,
      setCurrentOrg: (orgId) =>
        set({ currentOrgId: orgId, isInitialized: true }),
      clearCurrentOrg: () => set({ currentOrgId: null }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (state) => ({ currentOrgId: state.currentOrgId }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setInitialized(true);
        }
      },
    }
  )
);
