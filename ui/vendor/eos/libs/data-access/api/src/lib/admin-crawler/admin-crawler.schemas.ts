import { z } from 'zod';

export const crawlerDiscoverRequestSchema = z.object({
  url: z.string().url(),
  max_depth: z.number().int().min(1).max(10).default(2),
  max_pages: z.number().int().min(1).max(500).default(100),
  include_pattern: z.string().nullable().optional(),
  exclude_pattern: z.string().nullable().optional(),
  respect_robots_txt: z.boolean().default(true),
});

export type CrawlerDiscoverRequest = z.infer<
  typeof crawlerDiscoverRequestSchema
>;

export const discoveredLinkSchema = z.object({
  url: z.string(),
  title: z.string().nullable().optional(),
  content_type: z.string().nullable().optional(),
  is_pdf: z.boolean(),
  discovered_from: z.string().nullable().optional(),
});

export type DiscoveredLink = z.infer<typeof discoveredLinkSchema>;

export const crawlerDiscoverResponseSchema = z.object({
  domain: z.string(),
  links: z.array(discoveredLinkSchema),
  total_count: z.number().int(),
  robots_txt_respected: z.boolean(),
});

export type CrawlerDiscoverResponse = z.infer<
  typeof crawlerDiscoverResponseSchema
>;

export const crawlerIngestItemSchema = z.object({
  url: z.string(),
  file_id: z.string().uuid().nullable().optional(),
  status: z.string(),
  error: z.string().nullable().optional(),
  is_overwrite: z.boolean(),
});

export type CrawlerIngestItem = z.infer<typeof crawlerIngestItemSchema>;

export const crawlerIngestRequestSchema = z.object({
  organization_id: z.string().uuid(),
  urls: z.array(z.string().min(1)).min(1).max(300),
  tags: z.array(z.string()).max(20).default([]),
  force_overwrite: z.boolean().default(false),
});

export type CrawlerIngestRequest = z.infer<typeof crawlerIngestRequestSchema>;

export const crawlerIngestResponseSchema = z.object({
  organization_id: z.string().uuid(),
  processed: z.number().int(),
  successful: z.number().int(),
  failed: z.number().int(),
  results: z.array(crawlerIngestItemSchema),
});

export type CrawlerIngestResponse = z.infer<typeof crawlerIngestResponseSchema>;
