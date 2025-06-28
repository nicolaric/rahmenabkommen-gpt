import { ReactNode } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { QuestionIcon } from '@phosphor-icons/react';
import { Link } from '@remix-run/react';

type HeaderProps = {
    children?: ReactNode;
    navigateHome?: () => void;
    hideLogo?: boolean;
};

export function Header({ children, navigateHome, hideLogo }: HeaderProps) {
    return (
        <div className="fixed left-0 top-0 flex h-12 w-full items-center justify-between gap-2 bg-gray-100 p-4 pt-6 dark:bg-gray-950">
            {!hideLogo && (
                <Link
                    to="/"
                    className="flex items-center gap-2 sm:gap-3 md:gap-3 lg:gap-3"
                    onClick={navigateHome ? navigateHome : void 0}
                >
                    <img src="/logo-colored.webp" alt="Logo" width="28px" height="28px" />
                    <div className="text-lg text-gray-700 dark:text-white sm:text-2xl md:text-4xl lg:text-3xl">
                        Rahmenabkommen GPT
                    </div>
                </Link>
            )}
            {hideLogo && (
                <>
                    <div className="hidden sm:flex"></div>
                    <Link
                        to="/"
                        className="flex items-center gap-2 sm:hidden sm:gap-3 md:gap-3 lg:gap-3"
                        onClick={navigateHome ? navigateHome : void 0}
                    >
                        <img
                            src="/logo-colored.webp"
                            alt="Logo"
                            width="28px"
                            height="28px"
                        />
                        <div className="text-lg text-gray-700 dark:text-white sm:text-2xl md:text-4xl lg:text-3xl">
                            Rahmenabkommen GPT
                        </div>
                    </Link>
                </>
            )}

            <div className="flex items-center gap-4">
                <Link to="/help">
                    <QuestionIcon size={32} />
                </Link>
                {children}
                <ThemeToggle />
            </div>
        </div>
    );
}
