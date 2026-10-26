import { lazy } from 'react';

/**
 * Client-deferred entry point for the PDF viewer.
 *
 * `pdf-viewer` pulls in react-pdf -> pdfjs-dist, whose canvas module touches
 * `DOMMatrix` at import time. Node has no such global, so a static re-export
 * from the component barrel crashes any SSR server that imports the barrel
 * for something unrelated (landing-ui's demo route did exactly that).
 *
 * Keep the barrel pointing here: `lazy` defers the import to the browser, so
 * pdfjs is only evaluated once the viewer actually renders. Consumers must
 * render it inside a `<Suspense>` boundary.
 */
export default lazy(() => import('./pdf-viewer'));
