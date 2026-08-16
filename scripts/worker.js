// export default {
//   async fetch(request) {
//     const url = new URL(request.url);
//     // Replace this with your exact B2 endpoint (e.g. s3.us-west-004.backblazeb2.com)
//     url.hostname = "s3.us-east-005.backblazeb2.com"; 
    
//     // Cloudflare handles the Host header automatically
//     return fetch(new Request(url, request));
//   }
// }

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request) {
    // Handle CORS preflight immediately
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const targetHost = pathParts[0];

    if (!targetHost || !targetHost.includes('backblazeb2.com')) {
      return new Response('Smart Proxy: Invalid or missing B2 endpoint.', {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    // Rebuild the B2 URL — host from path prefix, rest of path is the actual key
    url.hostname = targetHost;
    url.pathname = '/' + pathParts.slice(1).join('/');

    // Strip headers that would break B2's presigned URL signature validation
    const cleanHeaders = new Headers();
    for (const [key, value] of request.headers.entries()) {
      const lower = key.toLowerCase();
      if (lower === 'host' || lower === 'origin' || lower === 'referer') continue;
      cleanHeaders.set(key, value);
    }

    let response;
    try {
      response = await fetch(new Request(url.toString(), {
        method: request.method,
        headers: cleanHeaders,
      }));
    } catch (err) {
      return new Response('Proxy error: ' + err.message, {
        status: 502,
        headers: CORS_HEADERS,
      });
    }

    // Always inject CORS headers so the browser can read the response
    const newHeaders = new Headers(response.headers);
    for (const [k, v] of Object.entries(CORS_HEADERS)) {
      newHeaders.set(k, v);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  },
};