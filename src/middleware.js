import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
    const { request } = context;
    const url = new URL(request.url);

    // Proxy /api requests to the backend
    if (url.pathname.startsWith("/api")) {
        const backendUrl = import.meta.env.BACKEND_URL || "http://localhost:3000";
        const targetUrl = new URL(url.pathname + url.search, backendUrl);

        // Create a new request to the backend
        const proxyRequest = new Request(targetUrl, {
            method: request.method,
            headers: request.headers,
            body: request.body,
            duplex: "half", // Required for streaming bodies in some environments
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
            return new Response(JSON.stringify({ error: "Backend unavailable" }), {
                status: 502,
                headers: { "Content-Type": "application/json" },
            });
        }
    }

    return next();
});
