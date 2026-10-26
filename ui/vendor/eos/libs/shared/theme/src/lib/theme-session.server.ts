import { createCookieSessionStorage } from 'react-router';
import { createThemeSessionResolver } from 'remix-themes';

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: '__eos_theme',
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secrets: [process.env['SESSION_SECRET'] ?? 'secret'],
    secure: process.env['NODE_ENV'] === 'production',
    maxAge: 60 * 60 * 24 * 365,
  },
});

export const themeSessionResolver = createThemeSessionResolver(sessionStorage);
