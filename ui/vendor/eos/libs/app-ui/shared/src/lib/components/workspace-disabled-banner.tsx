import { useTranslation } from 'react-i18next';

type WorkspaceDisabledBannerProps = {
  isDisabled?: boolean;
};

export function WorkspaceDisabledBanner({
  isDisabled,
}: WorkspaceDisabledBannerProps) {
  const { t } = useTranslation('workspaceSettings');

  if (!isDisabled) {
    return null;
  }

  return (
    <div className="mx-4 mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
      {t('disabledBanner')}
    </div>
  );
}
