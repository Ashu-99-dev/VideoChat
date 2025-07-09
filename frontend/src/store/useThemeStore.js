import { create } from "zustand";

export const useThemeStore = create((set) => ({
  theme: localStorage.getItem("VideoChat") || "night",
  setTheme: (theme) => {
    localStorage.setItem("VideoChat", theme);
    set({ theme });
  },
}));