import { apiFetchJson } from '@eos/data-access/shared';
import { ApiContextOptions, buildContextUrl } from '../context/context';
import {
  transcriptionConfigSchema,
  transcriptionResponseSchema,
} from './transcriptions.schemas';
import type {
  TranscriptionConfig,
  TranscriptionResponse,
} from './transcriptions.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/transcriptions`;

export async function getTranscriptionConfig(
  organizationId: string,
  options?: ApiContextOptions,
): Promise<TranscriptionConfig> {
  return apiFetchJson(
    buildContextUrl(`${baseUrl}/config`, organizationId, options),
    { method: 'GET' },
    {
      responseSchema: transcriptionConfigSchema,
      schemaName: 'TranscriptionConfig',
    },
  );
}

/** Turn a dictated recording into text. The recording is not stored. */
export async function transcribeRecording(
  recording: Blob,
  organizationId: string,
  options?: ApiContextOptions & { language?: string; prompt?: string },
): Promise<TranscriptionResponse> {
  const formData = new FormData();
  formData.append('file', recording, 'dictation');
  if (options?.language) formData.append('language', options.language);
  // The text dictated just before, so phrases sent one by one read as one.
  if (options?.prompt) formData.append('prompt', options.prompt);

  return apiFetchJson(
    buildContextUrl(baseUrl, organizationId, options),
    { method: 'POST', body: formData },
    {
      responseSchema: transcriptionResponseSchema,
      schemaName: 'TranscriptionResponse',
    },
  );
}
