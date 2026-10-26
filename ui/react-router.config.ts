import type { Config } from '@react-router/dev/config';

export default {
  ssr: true,
  appDirectory: 'app',
  // nginx forwards plain http to the app, so the browser's https Origin
  // never matches the request URL and actions are rejected as CSRF
  allowedActionOrigins: ['rahmenabkommen-gpt.ch', 'www.rahmenabkommen-gpt.ch'],
} satisfies Config;
