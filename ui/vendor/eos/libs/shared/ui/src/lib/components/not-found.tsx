import { ErrorPage } from './error-page';

type NotFoundProps = {
  homeHref?: string;
  homeLabel?: string;
};

export function NotFound({
  homeHref,
  homeLabel = 'Go to home',
}: NotFoundProps) {
  return (
    <ErrorPage
      status={404}
      message="This page could not be found."
      homeHref={homeHref}
      homeLabel={homeHref ? homeLabel : undefined}
    />
  );
}
