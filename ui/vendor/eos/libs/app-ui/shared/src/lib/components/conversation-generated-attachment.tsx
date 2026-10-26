import { useState } from 'react';
import { ConversationDocumentCard } from './conversation-document-card';

export interface ConversationGeneratedAttachmentProps {
  apiUrl: string;
  organizationId?: string | null;
  workspaceId?: string | null;
  attachment: {
    artifact_id: string;
    filename: string;
    format: string;
    download_path: string;
    status?: string;
  };
  unavailableLabel?: string;
}

export function buildGeneratedAttachmentDownloadUrl({
  apiUrl,
  downloadPath,
  organizationId,
  workspaceId,
}: {
  apiUrl?: string;
  downloadPath: string;
  organizationId?: string | null;
  workspaceId?: string | null;
}) {
  const baseUrl =
    apiUrl ||
    (typeof window === 'undefined' ? 'http://localhost' : window.location.origin);
  const rawUrl = downloadPath.startsWith('http')
    ? downloadPath
    : `${baseUrl.replace(/\/$/, '')}/${downloadPath.replace(/^\//, '')}`;
  const url = new URL(rawUrl);
  if (organizationId && !url.searchParams.has('organizationId')) {
    url.searchParams.set('organizationId', organizationId);
  }
  if (workspaceId && !url.searchParams.has('workspaceId')) {
    url.searchParams.set('workspaceId', workspaceId);
  }
  return url.toString();
}

export function ConversationGeneratedAttachment({
  apiUrl,
  organizationId,
  workspaceId,
  attachment,
  unavailableLabel = 'File could not be downloaded.',
}: ConversationGeneratedAttachmentProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(false);
  const downloadUrl = buildGeneratedAttachmentDownloadUrl({
    apiUrl,
    downloadPath: attachment.download_path,
    organizationId,
    workspaceId,
  });

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(false);
    try {
      const response = await fetch(downloadUrl, { credentials: 'include' });
      if (!response.ok) throw new Error(`Download failed: ${response.status}`);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = attachment.filename;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch {
      setError(true);
    } finally {
      setIsDownloading(false);
    }
  };

  const description = isDownloading
    ? 'Downloading…'
    : attachment.status === 'ready'
      ? `${attachment.format.toUpperCase()} · Download`
      : `${attachment.format.toUpperCase()} · Unavailable`;

  return (
    <div className="max-w-md space-y-1">
      <ConversationDocumentCard
        label={attachment.filename}
        description={description}
        onClick={handleDownload}
        disabled={isDownloading || attachment.status !== 'ready'}
        ariaLabel={`Download ${attachment.filename}`}
      />
      {error && (
        <p role="alert" className="px-1 text-xs text-destructive">
          {unavailableLabel}
        </p>
      )}
    </div>
  );
}
