import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarCollapsed: boolean;
  darkMode: boolean;
}

const storedDarkMode = localStorage.getItem('spa_dark_mode') === 'true';

const initialState: UiState = {
  sidebarCollapsed: false,
  darkMode: storedDarkMode,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
    },
    setSidebarCollapsed: (state, action: PayloadAction<boolean>) => {
      state.sidebarCollapsed = action.payload;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('spa_dark_mode', String(state.darkMode));
      document.documentElement.setAttribute(
        'data-theme',
        state.darkMode ? 'dark' : 'light'
      );
    },
  },
});

export const { toggleSidebar, setSidebarCollapsed, toggleDarkMode } = uiSlice.actions;
export default uiSlice.reducer;
