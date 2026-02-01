import { create } from "zustand";
import { persist } from "zustand/middleware";

const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours

interface GuestSession {
  id: string;
  createdAt: number;
  draftSheetId?: string;
  draftParts: string[]; // Part IDs in guest draft
}

interface AppState {
  // Guest session management
  guestSession: GuestSession | null;

  // UI preferences
  sidebarCollapsed: boolean;
  canvasToolbarPosition: "bottom" | "left" | "right";

  // Current workflow state
  currentSheetId: string | null;
  currentMaterial: string;
  currentThickness: string;

  // Actions
  initGuestSession: () => string;
  clearGuestSession: () => void;
  setDraftSheetId: (sheetId: string) => void;
  addDraftPart: (partId: string) => void;
  removeDraftPart: (partId: string) => void;

  setSidebarCollapsed: (collapsed: boolean) => void;
  setCanvasToolbarPosition: (position: "bottom" | "left" | "right") => void;

  setCurrentSheet: (sheetId: string | null) => void;
  setCurrentMaterial: (material: string) => void;
  setCurrentThickness: (thickness: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      guestSession: null,
      sidebarCollapsed: false,
      canvasToolbarPosition: "bottom",
      currentSheetId: null,
      currentMaterial: "steel",
      currentThickness: "3",

      // Guest session actions
      initGuestSession: () => {
        const existing = get().guestSession;
        // Reuse session if less than 24 hours old
        if (existing && Date.now() - existing.createdAt < SESSION_LIFETIME_MS) {
          return existing.id;
        }
        const id = crypto.randomUUID();
        set({
          guestSession: {
            id,
            createdAt: Date.now(),
            draftParts: [],
          },
        });
        return id;
      },

      clearGuestSession: () => set({ guestSession: null }),

      setDraftSheetId: (sheetId) =>
        set((state) => ({
          guestSession: state.guestSession
            ? { ...state.guestSession, draftSheetId: sheetId }
            : null,
        })),

      addDraftPart: (partId) =>
        set((state) => ({
          guestSession: state.guestSession
            ? {
                ...state.guestSession,
                draftParts: [...state.guestSession.draftParts, partId],
              }
            : null,
        })),

      removeDraftPart: (partId) =>
        set((state) => ({
          guestSession: state.guestSession
            ? {
                ...state.guestSession,
                draftParts: state.guestSession.draftParts.filter(
                  (id) => id !== partId
                ),
              }
            : null,
        })),

      // UI preference actions
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCanvasToolbarPosition: (position) =>
        set({ canvasToolbarPosition: position }),

      // Workflow actions
      setCurrentSheet: (sheetId) => set({ currentSheetId: sheetId }),
      setCurrentMaterial: (material) => set({ currentMaterial: material }),
      setCurrentThickness: (thickness) => set({ currentThickness: thickness }),
    }),
    {
      name: "sheetmates-app-storage",
      partialize: (state) => ({
        guestSession: state.guestSession,
        sidebarCollapsed: state.sidebarCollapsed,
        canvasToolbarPosition: state.canvasToolbarPosition,
        currentSheetId: state.currentSheetId,
        currentMaterial: state.currentMaterial,
        currentThickness: state.currentThickness,
      }),
    }
  )
);
