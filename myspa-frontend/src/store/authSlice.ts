import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { UserInfo, LoginRequest, AuthResponse } from '@/types';
import { JWT_KEYS } from '@constants/config';
import axiosInstance from '@api/axiosInstance';
import { USE_MOCK } from '@constants/config';
import type { ApiResponse } from '@/types';

// Mock login
const mockLogin = async (credentials: LoginRequest): Promise<AuthResponse> => {
  await new Promise((r) => setTimeout(r, 800));
  if (credentials.userName === 'admin' && credentials.password === 'admin123') {
    return { token: 'mock-jwt-token-admin', authenticated: true };
  }
  throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
};

// Async Thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      if (USE_MOCK) {
        const authData = await mockLogin(credentials);
        const userInfo: UserInfo = {
          userId: 'user-001',
          userName: credentials.userName,
          roles: [{ name: 'ADMIN', description: 'Quản trị viên', permissions: [] }],
        };
        localStorage.setItem(JWT_KEYS.accessToken, authData.token ?? '');
        localStorage.setItem(JWT_KEYS.user, JSON.stringify(userInfo));
        return { token: authData.token, user: userInfo };
      }

      // Gọi đúng endpoint /auth/login của backend
      const response = await axiosInstance.post<ApiResponse<AuthResponse>>(
        '/auth/login',
        { username: credentials.userName, password: credentials.password }
      );
      const data = response.data.result;

      // Lưu access token
      const token = data.accessToken ?? data.token ?? '';
      localStorage.setItem(JWT_KEYS.accessToken, token);
      if (data.refreshToken) {
        localStorage.setItem(JWT_KEYS.refreshToken, data.refreshToken);
      }

      // Build userInfo từ response thực của backend
      const userInfo: UserInfo = {
        userId: data.userId ?? '',
        userName: data.username ?? credentials.userName,
        roles: data.roles
          ? [...data.roles].map((r) =>
              typeof r === 'string'
                ? { name: r, description: '', permissions: [] }
                : r
            )
          : [],
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        avatarUrl: data.avatarUrl,
      };
      localStorage.setItem(JWT_KEYS.user, JSON.stringify(userInfo));

      return { token, user: userInfo };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Đăng nhập thất bại';
      return rejectWithValue(message);
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  if (!USE_MOCK) {
    try {
      const token = localStorage.getItem(JWT_KEYS.accessToken);
      if (token) {
        await axiosInstance.post('/auth/logout', { token });
      }
    } catch {
      // ignore logout errors
    }
  }
  localStorage.removeItem(JWT_KEYS.accessToken);
  localStorage.removeItem(JWT_KEYS.refreshToken);
  localStorage.removeItem(JWT_KEYS.user);
});

// State
interface AuthState {
  user: UserInfo | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const storedUser = localStorage.getItem(JWT_KEYS.user);
const storedToken = localStorage.getItem(JWT_KEYS.accessToken);

const initialState: AuthState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  accessToken: storedToken,
  isAuthenticated: !!storedToken,
  isLoading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setTokens: (state, action: PayloadAction<{ accessToken: string }>) => {
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.accessToken = action.payload.token ?? null;
        state.user = action.payload.user;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isAuthenticated = false;
      });
  },
});

export const { setTokens, clearError } = authSlice.actions;
export default authSlice.reducer;
