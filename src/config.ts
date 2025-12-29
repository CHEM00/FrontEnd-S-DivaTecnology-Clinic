export const IS_SERVER = import.meta.env.SSR;
export const IS_DEV = import.meta.env.DEV;

const PRODUCTION_API_URL = "https://api.jesstherapy.cloud";

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
export const getImageUrl = (path: string) => {
    if (!path) return "";

    // Normalize path to remove leading slash if present to avoid double slashes
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;

    // Normalize Windows backslashes to forward slashes
    const normalizedPath = cleanPath.replace(/\\/g, "/");

    // Handle paths that might already contain 'uploads/'
    if (normalizedPath.startsWith("uploads/")) {
        return `${PRODUCTION_API_URL}/${normalizedPath}`;
    }

    return `${PRODUCTION_API_URL}/uploads/${normalizedPath}`;
};

// Export backend URL constant for cases where raw access is strictly needed server-side
export const SERVER_BACKEND_URL = PRODUCTION_API_URL;
