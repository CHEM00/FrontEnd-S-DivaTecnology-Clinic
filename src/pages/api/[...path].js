export const ALL = async ({ request, url }) => {
    // Construct the target URL
    // The path parameter captures everything after /api/
    // But we can just use the request URL to reconstruct the target

    const backendUrl = import.meta.env.BACKEND_URL || "https://api.jesstherapy.cloud";

    // url.pathname includes /api/..., so we can just append it to the backend origin if backendUrl is just the origin
    // But if backendUrl includes /api, we need to be careful.
    // Assuming BACKEND_URL is "https://api.jesstherapy.cloud" (without /api suffix based on previous context)
    // and the request is /api/v1/..., we want https://api.jesstherapy.cloud/api/v1/...

    // Let's parse the backend URL to be safe
    const backendUrlObj = new URL(backendUrl);
    const targetUrl = new URL(url.pathname + url.search, backendUrlObj);

    // Prepare headers
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");
    headers.delete("content-length");

    // Create SSL Agent
    const { Agent } = await import("node:https");
    const agent = new Agent({ rejectUnauthorized: false });

    // Read body
    let body = null;
    if (request.method !== "GET" && request.method !== "HEAD") {
        const contentType = request.headers.get("content-type") || "";
        try {
            if (contentType.includes("application/json")) {
                body = await request.text();
                // Ensure we send valid JSON
                if (!body) body = "{}";
            } else {
                body = await request.arrayBuffer();
            }
        } catch (e) {
            console.error("[Proxy] Error reading body:", e);
        }
    }

    // Debug
    console.log(`[API Route] ${request.method} ${targetUrl}`);
    if (body && typeof body === 'string') console.log(`[API Route] Body: ${body.substring(0, 100)}...`);

    // Ensure Content-Type
    if (body && typeof body === 'string' && !headers.has("content-type")) {
        headers.set("content-type", "application/json");
    }

    const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: headers,
        body: body,
        // @ts-ignore
        agent: agent
    });

    try {
        const response = await fetch(proxyRequest, { agent });
        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
        });
    } catch (error) {
        console.error("[API Route] Proxy error:", error);
        return new Response(JSON.stringify({
            error: "Backend unavailable",
            details: error.message,
            target: targetUrl.toString()
        }), {
            status: 502,
            headers: { "Content-Type": "application/json" }
        });
    }
};
