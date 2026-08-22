export const IS_SERVER = import.meta.env.SSR;
export const IS_DEV = import.meta.env.DEV;

const DEFAULT_BACKEND_URL = "https://api.jesstherapy.cloud";

// process.env: runtime del server en producción (permite cambiar la URL sin rebuild).
// import.meta.env: `astro dev`, que carga el .env local. El typeof protege al navegador,
// donde `process` no existe.
const PRODUCTION_API_URL =
    (typeof process !== "undefined" ? process.env.BACKEND_URL : undefined) ??
    import.meta.env.BACKEND_URL ??
    DEFAULT_BACKEND_URL;

/**
 * Returns the base URL for API requests.
 * - Server-side (SSR): Always uses the absolute production URL.
 * - Client-side: Uses relative path '/api' to leverage the local Proxy (avoiding CORS),
 *   or absolute URL if directly in production build without proxy.
 */
export const getApiUrl = () => {
    if (IS_SERVER) {
        return PRODUCTION_API_URL;
    }
    // Client-side
    // In development, we use the proxy configured in astro.config.mjs
    // In production build (static), you might want absolute, but here we assume Node adapter.
    // Ideally, for client data fetching in this hybrid setup, relative is safest.
    return "/api/v1";
};

/**
 * Returns the base URL for Images/Static Assets.
 * - Always uses absolute production URL because images don't suffer from CORS
 *   and should be loaded directly from the source.
 */
export const PUBLIC_IMAGE_BASE_URL = import.meta.env.PUBLIC_IMAGES_URL || "https://api.jesstherapy.cloud";

export const getImageUrl = (path: string) => {
    if (!path) return "";

    // Normalize path to remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    // Normalize Windows backslashes to forward slashes
    const normalizedPath = cleanPath.replace(/\\/g, "/");

    // Handle paths that might already contain 'uploads/'
    if (normalizedPath.startsWith("uploads/")) {
        return `${PUBLIC_IMAGE_BASE_URL}/${normalizedPath}`;
    }

    return `${PUBLIC_IMAGE_BASE_URL}/uploads/${normalizedPath}`;
};

// Export backend URL constant for cases where raw access is strictly needed server-side
export const SERVER_BACKEND_URL = PRODUCTION_API_URL;

/**
 * URL del WebSocket, que el NAVEGADOR necesita resolver.
 *
 * No puede salir de SERVER_BACKEND_URL: `BACKEND_URL` no lleva el prefijo PUBLIC_,
 * así que Astro no la expone al cliente y en el navegador queda undefined,
 * cayendo al default de producción. Resultado: en local la agenda escuchaba los
 * eventos del servidor real de la clínica en vez de los del backend local.
 *
 * Con PUBLIC_ el valor sí viaja al navegador. Sin definir, mantiene el default
 * de producción, que es el correcto para el despliegue.
 */
export const SOCKET_URL =
    import.meta.env.PUBLIC_SOCKET_URL || DEFAULT_BACKEND_URL;
