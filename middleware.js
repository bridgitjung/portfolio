// Vercel Routing Middleware: password gate for the Ansys Discovery case study.
// Runs on the server before static files are served, so the page and its
// media can't be fetched without the unlock cookie.

export const config = {
  matcher: ["/discovery", "/discovery.html", "/discovery-unlock", "/assets/discovery/:path*"],
};

// SHA-256 of the password, and of "unlocked:" + that hash (the cookie value).
const PASSWORD_HASH = "c51531e6149f6166be65975c7a47ac2af8fa28aab53848f7164d7456942d59ed";
const COOKIE_VALUE = "a3d6a6f1d8ddecb14901f03aac7eb42fd0dca8dcffdee082dc45849c134c970c";
const COOKIE_NAME = "cs_discovery";

// The blurred homepage cover stays public.
const PUBLIC_ASSETS = new Set(["/assets/discovery/discoverycover.mp4"]);

async function sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

function hasCookie(request) {
  const cookies = request.headers.get("cookie") || "";
  return cookies.split(/;\s*/).some((c) => c === `${COOKIE_NAME}=${COOKIE_VALUE}`);
}

function next() {
  return new Response(null, { headers: { "x-middleware-next": "1" } });
}

function gatePage(wrong) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex" />
  <title>Ansys Discovery — bridgit jung</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Geist+Mono:wght@400;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="/css/style.css" />
  <link rel="icon" type="image/png" href="/assets/tiles/logo-tile.png" />
  <style>
    .gate { max-width: 440px; margin: 0 auto; padding: 12vh 0 80px; }
    .gate h1 { font-size: clamp(32px, 5vw, 44px); font-weight: 400; letter-spacing: -0.03em; line-height: 1.1; margin: 0 0 12px; }
    .gate p { color: var(--muted); line-height: 1.6; margin: 0 0 28px; }
    .gate form { display: flex; gap: 10px; flex-wrap: wrap; }
    .gate input { flex: 1 1 200px; min-width: 0; font: inherit; font-size: 16px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 10px; background: #fff; color: var(--text); }
    .gate input:focus { outline: 2px solid var(--text); outline-offset: 1px; }
    .gate button { font-family: var(--mono); font-size: 14px; padding: 12px 18px; border: 0; border-radius: 10px; background: var(--text); color: var(--bg); cursor: pointer; }
    .gate .gate-error { color: var(--coral-dkr); font-family: var(--mono); font-size: 13px; margin: 12px 0 0; }
    .gate .gate-note { font-family: var(--mono); font-size: 13px; margin-top: 28px; }
  </style>
</head>
<body>
  <header class="topbar">
    <a class="brand" href="/" aria-label="bridgit jung, home">
      <span aria-hidden="true">✿</span>
      <span>bridgit jung</span>
    </a>
    <nav class="topnav" aria-label="Main">
      <a href="/" aria-current="page">work</a>
      <a href="/art">play</a>
      <a href="/about">about</a>
    </nav>
  </header>
  <main class="cs">
    <a class="back-link" href="/">← all work</a>
    <div class="gate">
      <p class="cs-kicker">Ansys Discovery:</p>
      <h1>This case study is password protected</h1>
      <p>Enter the password to view it.</p>
      <form method="post" action="/discovery-unlock">
        <label class="sr-only" for="pw">Password</label>
        <input id="pw" name="password" type="password" autocomplete="current-password" required autofocus />
        <button type="submit">view case study →</button>
      </form>
      ${wrong ? '<p class="gate-error" role="alert">That password didn’t work. Try again.</p>' : ""}
      <p class="gate-note">Need access? Email <a class="accent" href="mailto:bridgit.jung@gmail.com">bridgit.jung@gmail.com</a>.</p>
    </div>
  </main>
</body>
</html>`;
}

function htmlResponse(body, status) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex",
    },
  });
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (PUBLIC_ASSETS.has(path)) return next();

  if (path === "/discovery-unlock") {
    if (request.method !== "POST") return Response.redirect(new URL("/discovery", url), 303);
    let password = "";
    try {
      const form = await request.formData();
      password = String(form.get("password") || "");
    } catch {}
    if ((await sha256(password)) !== PASSWORD_HASH) return htmlResponse(gatePage(true), 401);
    return new Response(null, {
      status: 303,
      headers: {
        location: "/discovery",
        "set-cookie": `${COOKIE_NAME}=${COOKIE_VALUE}; Path=/; Max-Age=2592000; HttpOnly; Secure; SameSite=Lax`,
        "cache-control": "no-store",
      },
    });
  }

  if (hasCookie(request)) return next();

  if (path.startsWith("/assets/")) return new Response("Password required", { status: 401 });
  return htmlResponse(gatePage(false), 401);
}
