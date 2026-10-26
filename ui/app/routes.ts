import { index, route } from '@react-router/dev/routes';

export default [
  index('routes/_index.tsx'),
  route('conversations/:id', 'routes/conversations.$id.tsx'),
  route('help', 'routes/help.tsx'),
  route('impressum', 'routes/impressum.tsx'),
  route('stats', 'routes/stats.tsx'),
  route('action/set-theme', 'routes/action.set-theme.tsx'),
  route('action/set-language', 'routes/action.set-language.tsx'),
  route('action/sync-conversation', 'routes/action.sync-conversation.tsx'),
  route('locales/:lng/:ns', 'routes/locales.$lng.$ns.tsx'),
  route('yeos/*', 'routes/yeos.$.tsx'),
] satisfies import('@react-router/dev/routes').RouteConfig;
