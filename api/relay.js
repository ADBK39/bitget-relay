export const config = {
  api: { bodyParser: false },
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const url = new URL(req.url, "http://x");
  const originalPath = url.searchParams.get("path") || url.pathname;
  url.searchParams.delete("path");
  const targetUrl = `https://api.bitget.com${originalPath}${url.search}`;

  const headers = {};
  Object.entries(req.headers).forEach(([k, v]) => {
    if (!/^(host|x-forwarded|x-real-ip|x-vercel)/i.test(k)) {
      headers[k] = v;
    }
  });

  let body;
  if (!["GET", "HEAD"].includes(req.method)) {
    const chunks = [];
    for await (const c of req) chunks.push(c);
    body = Buffer.concat(chunks);
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const text = await response.text();
    response.headers.forEach((v, k) => {
      if (!/^(transfer|content)-encoding$/i.test(k)) res.setHeader(k, v);
    });
    res.status(response.status).send(text);
  } catch (e) {
    res.status(502).json({ error: e.message });
  }
}
