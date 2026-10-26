import { Button } from '@eos/shared/ui';
import { CircleHelp, Moon, Sun } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Theme, useTheme } from 'remix-themes';

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
        <ThemeToggle />
      </div>
    </header>
  );
}
