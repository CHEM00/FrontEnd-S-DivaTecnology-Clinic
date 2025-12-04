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
        headers.delete("connection");
        headers.delete("content-length"); // Let fetch calculate the correct length from the body

        // Create a new request to the backend
        // We need a custom agent to bypass SSL errors if the backend cert is not trusted by Node
        // (common with internal Docker networks or self-signed certs)
        const { Agent } = await import("node:https");
        const agent = new Agent({ rejectUnauthorized: false });

        // Read the body explicitly to avoid stream issues and content-length mismatches
        let body = null;
        if (request.method !== "GET" && request.method !== "HEAD") {
            const contentType = request.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                body = await request.text();
            } else {
                body = await request.arrayBuffer();
            }
        }

        const proxyRequest = new Request(targetUrl, {
            method: request.method,
            headers: headers,
            body: body,
            // @ts-ignore - node-fetch supports agent, standard Request doesn't type it but it works in Node
            agent: agent
        });

        // Forward the backend response back to the client
        try {
            // Pass the agent to fetch as well just in case
            const response = await fetch(proxyRequest, { agent });
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
