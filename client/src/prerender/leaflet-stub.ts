// Build-time stand-in for `leaflet` and `react-leaflet`, which touch `window`
// on import. Maps are only rendered in the browser, so the prerender build
// just needs these modules to load.
const handler: ProxyHandler<() => void> = {
  get: (_target, prop) => (typeof prop === "symbol" || prop === "then" ? undefined : stub),
  set: () => true,
  apply: () => stub,
  construct: () => stub,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const stub: any = new Proxy(function leafletStub() {}, handler);

const renderNothing = () => null;

export default stub;
export const MapContainer = renderNothing;
export const TileLayer = renderNothing;
export const Marker = renderNothing;
export const Popup = renderNothing;
export const useMap = () => stub;
