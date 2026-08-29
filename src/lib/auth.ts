import { createInternalNeonAuth } from '@neondatabase/auth';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL || '';

export const neonAuth = createInternalNeonAuth(authUrl);
export const authClient = neonAuth.adapter;
export const getJWTToken = () => neonAuth.getJWTToken();
