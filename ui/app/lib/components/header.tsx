import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@eos/shared/ui';
import { CircleHelp, Languages, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useFetcher } from 'react-router';
import { Theme, useTheme } from 'remix-themes';
import { languages, toLanguage } from '../../locales/languages';

const languageNames = {
  de: 'Deutsch',
  fr: 'Français',
  it: 'Italiano',
} satisfies Record<(typeof languages)[number], string>;

type HeaderProps = {
  children?: ReactNode;
  onNavigateHome?: () => void;
  hideLogo?: boolean;
};

function ThemeToggle() {
  const { t } = useTranslation('common');
  const [theme, setTheme] = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('toggleTheme')}
      onClick={() => setTheme(theme === Theme.DARK ? Theme.LIGHT : Theme.DARK)}
    >
      {theme === Theme.DARK ? <Sun /> : <Moon />}
    </Button>
  );
}

function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common');
  const fetcher = useFetcher();

  // Switch right away; the action stores the choice in a cookie for SSR
  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    fetcher.submit({ lng }, { method: 'post', action: '/action/set-language' });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" aria-label={t('language')} />}
      >
        <Languages />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={toLanguage(i18n.language)}
          onValueChange={changeLanguage}
        >
          {languages.map((lng) => (
            <DropdownMenuRadioItem key={lng} value={lng} lang={lng}>
              {languageNames[lng]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({ children, onNavigateHome, hideLogo }: HeaderProps) {
  const { t } = useTranslation('common');

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full shrink-0 items-center justify-between gap-2 bg-background/95 px-4 backdrop-blur">
      <Link
        to="/"
        onClick={onNavigateHome}
        className={`flex items-center gap-2 ${hideLogo ? 'invisible' : ''}`}
      >
        <img src="/logo-colored.webp" alt="" width={28} height={28} />
        <span className="text-lg font-medium sm:text-2xl">{t('appName')}</span>
      </Link>
      <div className="flex items-center gap-1">
        {children}
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('help')}
          nativeButton={false}
          render={<Link to="/help" />}
        >
          <CircleHelp />
        </Button>
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
    </header>
  );
}
