import { lazy } from 'react';

/**
 * Client-deferred entry point for the video viewer.
 *
 * Unlike `pdf-viewer.lazy`, this one is not working around an SSR crash --
 * `video-viewer` is safe to import in Node today. It exists so the barrel
 * stops statically pulling a viewer that every consumer already renders
 * lazily, which kept the chunk merged into the main bundle (rollup's
 * INEFFECTIVE_DYNAMIC_IMPORT warning) and would turn into the same crash the
 * moment anything browser-only lands in the component.
 *
 * Consumers must render it inside a `<Suspense>` boundary.
 */
export default lazy(() => import('./video-viewer'));
