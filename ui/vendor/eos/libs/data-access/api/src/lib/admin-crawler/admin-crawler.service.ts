import {
  apiFetchJson,
  RequestContext,
  validateRequestSchema,
} from '@eos/data-access/shared';
import type {
  CrawlerDiscoverRequest,
  CrawlerDiscoverResponse,
  CrawlerIngestRequest,
  CrawlerIngestResponse,
} from './admin-crawler.schemas';
import {
  crawlerDiscoverRequestSchema,
  crawlerDiscoverResponseSchema,
  crawlerIngestRequestSchema,
  crawlerIngestResponseSchema,
} from './admin-crawler.schemas';

const baseUrl = `${import.meta.env.VITE_API_URL}/admin/crawler`;

export async function discoverCrawlerLinks(
  payload: CrawlerDiscoverRequest,
  context?: RequestContext,
): Promise<CrawlerDiscoverResponse> {
  validateRequestSchema(crawlerDiscoverRequestSchema, payload, {
    url: `${baseUrl}/discover`,
    schemaName: 'CrawlerDiscoverRequest',
  });
  return apiFetchJson(
    `${baseUrl}/discover`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: crawlerDiscoverRequestSchema,
      responseSchema: crawlerDiscoverResponseSchema,
      schemaName: 'CrawlerDiscoverResponse',
      requestBody: payload,
    },
  );
}

export async function ingestCrawlerUrls(
  payload: CrawlerIngestRequest,
  context?: RequestContext,
): Promise<CrawlerIngestResponse> {
  validateRequestSchema(crawlerIngestRequestSchema, payload, {
    url: `${baseUrl}/ingest`,
    schemaName: 'CrawlerIngestRequest',
  });
  return apiFetchJson(
    `${baseUrl}/ingest`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
    {
      ...context,
      requestSchema: crawlerIngestRequestSchema,
      responseSchema: crawlerIngestResponseSchema,
      schemaName: 'CrawlerIngestResponse',
      requestBody: payload,
    },
  );
}
