import { create } from 'zustand';

interface AppState {
  language: 'en' | 'ar';
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  setLanguage: (lang: 'en' | 'ar') => void;
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
}

export const useAppStore = create<AppState>()((set) => ({
  language: (localStorage.getItem('language') as 'en' | 'ar') || 'ar',
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  sidebarCollapsed: false,

  setLanguage: (lang) => {
    localStorage.setItem('language', lang);
    set({ language: lang });
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  },

  setTheme: (theme) => {
    localStorage.setItem('theme', theme);
    set({ theme });
  },

  toggleSidebar: () => {
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }));
  },
}));
