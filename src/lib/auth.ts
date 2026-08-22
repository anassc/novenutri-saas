import { createAuthClient } from '@neondatabase/auth';

const authUrl = import.meta.env.VITE_NEON_AUTH_URL || '';

export const authClient = createAuthClient(authUrl);
