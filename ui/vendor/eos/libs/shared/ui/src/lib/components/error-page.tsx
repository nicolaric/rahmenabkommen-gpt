type ErrorPageProps = {
  status: number;
  message: string;
  homeHref?: string;
  homeLabel?: string;
};

export function ErrorPage({
  status,
  message,
  homeHref,
  homeLabel,
}: ErrorPageProps) {
  return (
    <main className="flex-1 flex flex-col">
      <style>{`
        body {
          color: #000;
          background: #fff;
          margin: 0;
        }

        .next-error-h1 {
          border-right: 1px solid rgba(0, 0, 0, 0.3);
        }

        @media (prefers-color-scheme: dark) {
          body {
            color: #fff;
            background: #000;
          }

          .next-error-h1 {
            border-right: 1px solid rgba(255, 255, 255, 0.3);
          }
        }
      `}</style>
      <div
        style={{
          fontFamily:
            'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
          height: '100vh',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div>
          <div>
            <h1
              className="next-error-h1"
              style={{
                display: 'inline-block',
                margin: '0 20px 0 0',
                padding: '0 23px 0 0',
                fontSize: 24,
                fontWeight: 500,
                verticalAlign: 'top',
                lineHeight: '49px',
              }}
            >
              {status}
            </h1>
            <div style={{ display: 'inline-block' }}>
              <h2
                style={{
                  fontSize: 14,
                  fontWeight: 400,
                  lineHeight: '49px',
                  margin: 0,
                }}
              >
                {message}
              </h2>
            </div>
          </div>
          {homeHref && homeLabel ? (
            <a
              href={homeHref}
              style={{
                color: 'inherit',
                display: 'inline-block',
                fontSize: 14,
                marginTop: 20,
                textDecoration: 'underline',
                textUnderlineOffset: 4,
              }}
            >
              {homeLabel}
            </a>
          ) : null}
        </div>
      </div>
    </main>
  );
}
