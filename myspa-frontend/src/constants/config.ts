// ============================================================
// Application Configuration Constants
// ============================================================

export const APP_CONFIG = {
  name: 'MY SPA',
  version: '1.0.0',
  description: 'Hệ thống quản lý spa chuyên nghiệp',
} as const;

// Set to true to use mock data (no backend required)
export const USE_MOCK = false;

export const API_BASE_URL = '/api/v1';

export const PAGINATION = {
  defaultPage: 0,
  defaultPageSize: 10,
  pageSizeOptions: [5, 10, 20, 50],
} as const;

export const DATE_FORMAT = {
  display: 'DD/MM/YYYY',
  displayTime: 'DD/MM/YYYY HH:mm',
  api: 'YYYY-MM-DD',
  apiTime: 'YYYY-MM-DDTHH:mm:ss',
} as const;

export const CURRENCY = {
  locale: 'vi-VN',
  currency: 'VND',
} as const;

export const LOW_STOCK_THRESHOLD = 10;

export const JWT_KEYS = {
  accessToken: 'spa_access_token',
  refreshToken: 'spa_refresh_token',
  user: 'spa_user',
} as const;
