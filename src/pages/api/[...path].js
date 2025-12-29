export const ALL = async ({ request, url }) => {
    // Construct the target URL
    // The path parameter captures everything after /api/
    // But we can just use the request URL to reconstruct the target

    const { SERVER_BACKEND_URL } = await import("../../config");
    const backendUrl = SERVER_BACKEND_URL;
    if (!backendUrl) {
        return new Response("BACKEND_URL not defined in environment variables", { status: 500 });
    }

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

    // Stream body directly
    const body = request.body;

    // Debug content type only
    console.log(`[API Route] ${request.method} ${targetUrl}`);

    const proxyRequest = new Request(targetUrl, {
        method: request.method,
        headers: headers,
        body: body,
        duplex: 'half',
        // @ts-ignore
        agent: agent
    });

    try {
        const response = await fetch(proxyRequest, { agent });

        // Create new headers to modify Set-Cookie if needed
        const responseHeaders = new Headers(response.headers);

        // Rewrite Set-Cookie to ensure it works on the frontend domain
        // If the backend sets a cookie, it might be for 'api.jesstherapy.cloud'
        // We want the browser to accept it for 'jesstherapy.cloud' (the frontend)
        const setCookie = responseHeaders.get("set-cookie");
        if (setCookie) {
            // Remove 'Domain=...' to let it default to the current domain (frontend)
            // Or replace it with the frontend domain
            // Simple approach: Remove Domain attribute
            const newSetCookie = setCookie.replace(/Domain=[^;]+;?/gi, "");
            responseHeaders.set("set-cookie", newSetCookie);
        }

        // Remove headers that might cause issues with the proxy response
        responseHeaders.delete("content-encoding");
        responseHeaders.delete("content-length");
        responseHeaders.delete("transfer-encoding");

        return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
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
