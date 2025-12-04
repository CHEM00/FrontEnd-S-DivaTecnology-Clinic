import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const { request } = context;
    const url = new URL(request.url);

    // Proxy /api requests to the backend
    if (url.pathname.startsWith("/api")) {
        // Use the environment variable or the user's provided URL as fallback
        const backendUrl = import.meta.env.BACKEND_URL || "https://api.jesstherapy.cloud";
        const targetUrl = new URL(url.pathname + url.search, backendUrl);

        // Prepare headers: Remove 'host' to avoid virtual host issues on the backend
        const headers = new Headers(request.headers);
        headers.delete("host");
        headers.delete("connection"); // Let the fetch client handle connection

        // Create a new request to the backend
        const proxyRequest = new Request(targetUrl, {
            method: request.method,
            headers: headers,
            body: request.body,
            duplex: "half",
        });

        // Forward the backend response back to the client
        try {
            const response = await fetch(proxyRequest);
            return new Response(response.body, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
            });
        } catch (error) {
            console.error("Proxy error:", error);
            return new Response(JSON.stringify({
                error: "Backend unavailable",
                details: error.message,
                cause: error.cause,
                target: targetUrl.toString()
            }), {
                status: 502,
                headers: { "Content-Type": "application/json" },
            });
        }
    }

    return next();
});
