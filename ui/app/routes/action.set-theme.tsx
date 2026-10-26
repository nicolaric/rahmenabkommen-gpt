import { themeSessionResolver } from '@eos/shared/theme/server';
import { createThemeAction } from 'remix-themes';

export const action = createThemeAction(themeSessionResolver);
