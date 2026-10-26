import { z } from 'zod';

export const transcriptionConfigSchema = z.object({
  enabled: z.boolean(),
  max_bytes: z.number(),
});

export type TranscriptionConfig = z.infer<typeof transcriptionConfigSchema>;

export const transcriptionResponseSchema = z.object({
  text: z.string(),
});

export type TranscriptionResponse = z.infer<typeof transcriptionResponseSchema>;
