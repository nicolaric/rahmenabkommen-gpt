import { cn } from '@eos/utils';
import type * as React from 'react';

const ASSET_BASE = import.meta.env.VITE_LOCAL ? '' : '/app';

export type ServiceLogoProvider =
  | 'gmail'
  | 'outlook'
  | 'sharepoint'
  | 'teams'
  | 'onedrive'
  | 'rovo'
  | 'slack'
  | 'hubspot'
  | 'github'
  | 'fedlex'
  | 'sap';

type ServiceLogoProps = {
  provider: ServiceLogoProvider;
  className?: string;
};

/**
 * Brand marks for third-party services shown on connection/integration tiles.
 * SVG marks render inside a fixed 24x24 viewBox so sizing is controlled purely
 * by `className` on the wrapping chip. Official raster assets (`img`) are
 * rendered edge-to-edge without the white chip padding, since they already
 * ship as self-contained app icons.
 */
function GmailMark() {
  return (
    <img
      src={`${ASSET_BASE}/img/integrations/gmail.png`}
      alt="Gmail"
      className="h-full w-full object-contain"
    />
  );
}

function OutlookMark() {
  return (
    <img
      src={`${ASSET_BASE}/img/integrations/microsoft-365.svg`}
      alt="Microsoft 365"
      className="h-full w-full object-contain"
    />
  );
}

function SharePointMark() {
  return (
    <img
      src={`${ASSET_BASE}/img/integrations/sharepoint.svg`}
      alt="SharePoint"
      className="h-full w-full object-contain"
    />
  );
}

function TeamsMark() {
  return (
    <img
      src={`${ASSET_BASE}/img/integrations/teams.svg`}
      alt="Microsoft Teams"
      className="h-full w-full object-contain"
    />
  );
}

function OneDriveMark() {
  return (
    <img
      src={`${ASSET_BASE}/img/integrations/onedrive.svg`}
      alt="OneDrive"
      className="h-full w-full object-contain"
    />
  );
}

function RovoMark() {
  return (
    <img
      src={`${ASSET_BASE}/img/integrations/rovo.svg`}
      alt="Atlassian Rovo"
      className="h-full w-full object-contain"
    />
  );
}

function SlackMark() {
  return (
    <img
      src={`${ASSET_BASE}/img/integrations/slack.svg`}
      alt="Slack"
      className="h-full w-full object-contain"
    />
  );
}

function HubSpotMark() {
  return (
    <svg
      viewBox="0 0 248 246"
      className="h-full w-full"
      role="img"
      aria-label="HubSpot"
    >
      <rect
        x="0.75"
        y="0.75"
        width="246.5"
        height="244.5"
        fill="#fff"
        stroke="#CBD6E2"
        strokeWidth="1.5"
      />
      <path
        fill="#FF7A59"
        transform="translate(53 49)"
        d="M103.798521,106.777299 C92.7306793,106.777299 83.7587284,97.8985374 83.7587284,86.9475573 C83.7587284,75.9946743 92.7306793,67.1159127 103.798521,67.1159127 C114.866363,67.1159127 123.838313,75.9946743 123.838313,86.9475573 C123.838313,97.8985374 114.866363,106.777299 103.798521,106.777299 M109.797768,48.7685016 L109.797768,31.127053 C114.45103,28.9520799 117.710236,24.2938697 117.710236,18.8878342 L117.710236,18.4806214 C117.710236,11.0194931 111.54178,4.91510664 104.002342,4.91510664 L103.592778,4.91510664 C96.0533392,4.91510664 89.8848826,11.0194931 89.8848826,18.4806214 L89.8848826,18.8878342 C89.8848826,24.2938697 93.1440889,28.9539828 97.797351,31.1289559 L97.797351,48.7685016 C90.8693744,49.8283967 84.5393996,52.656052 79.318901,56.8176147 L30.373121,19.1390122 C30.6961574,17.9116652 30.923052,16.6481637 30.9249748,15.3199649 C30.9326662,6.87125044 24.0219951,0.0114270942 15.4807594,9.91250375e-06 C6.94336934,-0.0095044056 0.00962419728,6.83129031 1.00193251e-05,15.2819076 C-0.00960415863,23.732525 6.90106696,30.5923483 15.4423027,30.6018626 C18.2246458,30.6056684 20.8012454,29.8235914 23.0586544,28.5524785 L71.2045348,65.618359 C67.1108178,71.7341627 64.711119,79.0601876 64.711119,86.9475573 C64.711119,95.2040825 67.3473266,102.842177 71.8006138,109.12353 L57.1601437,123.613836 C56.0025966,123.269418 54.8027472,123.029657 53.5298301,123.029657 C46.513403,123.029657 40.8237325,128.658328 40.8237325,135.601877 C40.8237325,142.547329 46.513403,148.176 53.5298301,148.176 C60.54818,148.176 66.2359276,142.547329 66.2359276,135.601877 C66.2359276,134.345987 65.9936504,133.156697 65.6456171,132.011174 L80.1284148,117.678805 C86.7025897,122.643376 94.8900236,125.627066 103.798521,125.627066 C125.386196,125.627066 142.884,108.309104 142.884,86.9475573 C142.884,67.6087543 128.528109,51.6323114 109.797768,48.7685016"
      />
    </svg>
  );
}

function FedlexMark() {
  return (
    <svg viewBox="0 0 35.3 39.4" className="h-full w-full" aria-label="Fedlex">
      <path
        d="m35.3 2.9s-6.6-2.9-17.6-2.9c-11 0-17.6 2.9-17.6 2.9s-.7 12.8 1.9 20.1c4.4 12.7 15.7 16.4 15.7 16.4s11.3-3.6 15.7-16.4c2.4-7.3 1.9-20.1 1.9-20.1z"
        fill="#ff0000"
      />
      <path
        d="m29.3 14v7.1h-8.2v8.3h-7v-8.3h-8.3v-7.1h8.2v-8.3h7v8.3z"
        fill="#fffffe"
      />
    </svg>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
      <rect width="24" height="24" rx="5" fill="#181717" />
      <path
        fill="#fff"
        d="M12 4.3c-4.42 0-8 3.58-8 8 0 3.54 2.29 6.53 5.47 7.59.4.08.55-.17.55-.38 0-.19-.01-.7-.01-1.36-2.23.48-2.7-1.07-2.7-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.82 1.23.82.72 1.22 1.87.87 2.33.66.07-.52.28-.87.5-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 4 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.28.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.19 0 .21.14.46.55.38A8.01 8.01 0 0 0 20 12.3c0-4.42-3.58-8-8-8"
      />
    </svg>
  );
}

function SapMark() {
  return (
    <svg viewBox="0 0 48 24" className="h-full w-full" aria-label="SAP">
      <defs>
        <linearGradient id="sap-mark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00B8F1" />
          <stop offset="1" stopColor="#0057D2" />
        </linearGradient>
      </defs>
      <path d="M0 0h48L24 24H0z" fill="url(#sap-mark-fill)" />
      <text
        x="4"
        y="16.5"
        fill="#fff"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="12"
        fontWeight="700"
        letterSpacing="-0.3"
      >
        SAP
      </text>
    </svg>
  );
}

const MARKS: Record<ServiceLogoProvider, () => React.ReactElement> = {
  gmail: GmailMark,
  outlook: OutlookMark,
  sharepoint: SharePointMark,
  teams: TeamsMark,
  onedrive: OneDriveMark,
  rovo: RovoMark,
  slack: SlackMark,
  hubspot: HubSpotMark,
  github: GitHubMark,
  fedlex: FedlexMark,
  sap: SapMark,
};

// Providers whose asset already ships as a self-contained, filled app icon
// (its own background + rounded corners) and should render edge-to-edge
// instead of sitting inside the white padded chip used for transparent marks.
const BARE_PROVIDERS = new Set<ServiceLogoProvider>(['outlook', 'hubspot']);

export function ServiceLogo({ provider, className }: ServiceLogoProps) {
  const Mark = MARKS[provider];
  if (BARE_PROVIDERS.has(provider)) {
    return (
      <div className={cn('shrink-0 overflow-hidden rounded-xl', className)}>
        <Mark />
      </div>
    );
  }
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-sm ring-1 ring-black/5 dark:bg-white/95',
        className,
      )}
    >
      <Mark />
    </div>
  );
}
