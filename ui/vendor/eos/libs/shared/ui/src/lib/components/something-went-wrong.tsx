import { ErrorPage } from './error-page';

export function SomethingWentWrong() {
  return <ErrorPage status={500} message="Something went wrong." />;
}
