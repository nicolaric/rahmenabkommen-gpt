import { data } from 'react-router';
import { z } from 'zod';
import type { Route } from './+types/action.set-language';
import { languages } from '../locales/languages';
import { localeCookie } from '../middleware/i18next';

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const lng = z.enum(languages).safeParse(formData.get('lng'));

  if (lng.error) return data({ error: lng.error }, { status: 400 });

  return data(
    { lng: lng.data },
    { headers: { 'Set-Cookie': await localeCookie.serialize(lng.data) } },
  );
}
