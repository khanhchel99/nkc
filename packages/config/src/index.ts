export const AppConfig = {
  APP_NAME: 'nkc-erp',
  WEB_PORT: 3100,
} as const;

export const JwtConfig = {
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  ISSUER: 'nkc-erp',
} as const;

