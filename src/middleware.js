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
            const contentType = request.headers.get("content-type") || "";
            console.log(`[Proxy] Incoming Content-Type: ${contentType}`);

            try {
                // Clone the request to ensure we don't affect the original stream if needed elsewhere
                const reqClone = request.clone();

                if (contentType.includes("application/json")) {
                    body = await reqClone.text();
                    console.log(`[Proxy] Read body as text. Length: ${body.length}`);

                    // If text is empty but it's JSON, try json() directly as a fallback
                    if (body.length === 0) {
                        console.log("[Proxy] Body text is empty, trying json() on fresh clone...");
                        const jsonClone = request.clone();
                        const jsonData = await jsonClone.json();
                        body = JSON.stringify(jsonData);
                        console.log(`[Proxy] Recovered body via json(): ${body.length}`);
                    }
                } else {
                    body = await reqClone.arrayBuffer();
                    console.log(`[Proxy] Read body as ArrayBuffer. ByteLength: ${body.byteLength}`);
                }
            } catch (e) {
                console.error(`[Proxy] Error reading body: ${e.message}`);
            }
        }

        // Debug logging
        console.log(`[Proxy] ${request.method} ${targetUrl}`);
        if (body && typeof body === 'string') console.log(`[Proxy] Body: ${body.substring(0, 200)}...`);

        // Ensure Content-Type is set correctly for the backend
        if (body && typeof body === 'string' && !headers.has("content-type")) {
            headers.set("content-type", "application/json");
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
