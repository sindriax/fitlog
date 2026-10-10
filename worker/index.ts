import { EmailMessage } from 'cloudflare:email';

export interface Env {
	DB: D1Database;
	ASSETS: Fetcher;
	EMAIL: SendEmail;
	ALLOWED_EMAILS: string;
	EMAIL_FROM: string;
	APP_URL: string;
	DEV_LOG_LINKS?: string;
}

type Change = { kind: string; id: string; data: unknown; deleted: boolean };

const SESSION_COOKIE = 'fitlog_session';
const LINK_TTL = 15 * 60 * 1000;
const SESSION_TTL = 365 * 24 * 60 * 60 * 1000;
const KINDS = new Set(['workout', 'template', 'bodyweight', 'setup', 'prefs']);

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

function randomToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(value: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
	return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function cookie(request: Request, name: string): string | null {
	const match = request.headers.get('cookie')?.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
	return match ? decodeURIComponent(match[1]) : null;
}

async function currentUser(request: Request, env: Env): Promise<{ id: string; email: string } | null> {
	const token = cookie(request, SESSION_COOKIE);
	if (!token) return null;
	const hash = await sha256(token);
	const row = await env.DB.prepare(
		'SELECT users.id, users.email, sessions.created_at FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token_hash = ?'
	)
		.bind(hash)
		.first<{ id: string; email: string; created_at: number }>();
	if (!row || Date.now() - row.created_at > SESSION_TTL) return null;
	await env.DB.prepare('UPDATE sessions SET last_seen = ? WHERE token_hash = ?').bind(Date.now(), hash).run();
	return { id: row.id, email: row.email };
}

function loginEmail(env: Env, to: string, link: string): string {
	const boundary = `fitlog-${crypto.randomUUID()}`;
	const text = `Abre este enlace para entrar en FitLog:\n\n${link}\n\nCaduca en 15 minutos. Si no lo has pedido tú, ignora este correo.`;
	const html = `<p style="font-family:sans-serif">Toca el botón para entrar en FitLog:</p>
<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#34d399;color:#09090b;border-radius:12px;font-family:sans-serif;font-weight:600;text-decoration:none">Entrar en FitLog</a></p>
<p style="font-family:sans-serif;color:#71717a;font-size:13px">Caduca en 15 minutos. Si no lo has pedido tú, ignora este correo.</p>`;
	return [
		`From: FitLog <${env.EMAIL_FROM}>`,
		`To: ${to}`,
		'Subject: Tu enlace para entrar en FitLog',
		`Message-ID: <${crypto.randomUUID()}@${env.EMAIL_FROM.split('@')[1]}>`,
		`Date: ${new Date().toUTCString()}`,
		'MIME-Version: 1.0',
		`Content-Type: multipart/alternative; boundary="${boundary}"`,
		'',
		`--${boundary}`,
		'Content-Type: text/plain; charset=utf-8',
		'',
		text,
		`--${boundary}`,
		'Content-Type: text/html; charset=utf-8',
		'',
		html,
		`--${boundary}--`,
		''
	].join('\r\n');
}

async function requestLink(request: Request, env: Env): Promise<Response> {
	const { email } = (await request.json().catch(() => ({}))) as { email?: string };
	const normalized = email?.trim().toLowerCase() ?? '';
	const allowed = env.ALLOWED_EMAILS.split(',').map((e) => e.trim().toLowerCase());

	// Same answer either way, so the endpoint doesn't reveal which emails are allowed.
	const recent = allowed.includes(normalized)
		? await env.DB.prepare('SELECT 1 FROM login_tokens WHERE email = ? AND expires_at > ?')
				.bind(normalized, Date.now() + LINK_TTL - 60_000)
				.first()
		: null;

	if (allowed.includes(normalized) && !recent) {
		const token = randomToken();
		await env.DB.prepare('DELETE FROM login_tokens WHERE expires_at < ?').bind(Date.now()).run();
		await env.DB.prepare('INSERT INTO login_tokens (token_hash, email, expires_at) VALUES (?, ?, ?)')
			.bind(await sha256(token), normalized, Date.now() + LINK_TTL)
			.run();
		const link = `${env.APP_URL}/api/auth/verify?token=${token}`;
		if (env.DEV_LOG_LINKS) console.log(`Login link for ${normalized}: ${link}`);
		else await env.EMAIL.send(new EmailMessage(env.EMAIL_FROM, normalized, loginEmail(env, normalized, link)));
	}
	return json({ ok: true });
}

async function verifyLink(url: URL, env: Env): Promise<Response> {
	const token = url.searchParams.get('token') ?? '';
	const hash = await sha256(token);
	const row = await env.DB.prepare('DELETE FROM login_tokens WHERE token_hash = ? RETURNING email, expires_at')
		.bind(hash)
		.first<{ email: string; expires_at: number }>();
	if (!row || row.expires_at < Date.now()) {
		return Response.redirect(`${env.APP_URL}/settings?login=expired`, 302);
	}

	let user = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(row.email).first<{ id: string }>();
	if (!user) {
		user = { id: crypto.randomUUID() };
		await env.DB.prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)').bind(user.id, row.email, Date.now()).run();
	}

	const session = randomToken();
	await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, created_at, last_seen) VALUES (?, ?, ?, ?)')
		.bind(await sha256(session), user.id, Date.now(), Date.now())
		.run();

	const secure = env.APP_URL.startsWith('https') ? '; Secure' : '';
	return new Response(null, {
		status: 302,
		headers: {
			location: `${env.APP_URL}/settings?login=ok`,
			'set-cookie': `${SESSION_COOKIE}=${session}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL / 1000}${secure}`
		}
	});
}

async function logout(request: Request, env: Env): Promise<Response> {
	const token = cookie(request, SESSION_COOKIE);
	if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256(token)).run();
	return json({ ok: true }, 200, { 'set-cookie': `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` });
}

// The server stamps every write, so the most recent sync wins and device clocks don't matter.
async function sync(request: Request, env: Env, userId: string): Promise<Response> {
	const { since = 0, changes = [] } = (await request.json().catch(() => ({}))) as { since?: number; changes?: Change[] };
	const now = Date.now();

	const valid = changes.filter((c) => KINDS.has(c.kind) && typeof c.id === 'string' && c.id.length <= 200);
	if (valid.length > 0) {
		const upsert = env.DB.prepare(
			`INSERT INTO records (user_id, kind, id, data, updated_at, deleted) VALUES (?, ?, ?, ?, ?, ?)
			 ON CONFLICT (user_id, kind, id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at, deleted = excluded.deleted`
		);
		await env.DB.batch(
			valid.map((c) =>
				upsert.bind(userId, c.kind, c.id, c.deleted ? null : JSON.stringify(c.data), now, c.deleted ? 1 : 0)
			)
		);
	}

	const { results } = await env.DB.prepare(
		'SELECT kind, id, data, deleted FROM records WHERE user_id = ? AND updated_at > ? ORDER BY updated_at'
	)
		.bind(userId, since)
		.all<{ kind: string; id: string; data: string | null; deleted: number }>();

	return json({
		now,
		changes: results.map((r) => ({
			kind: r.kind,
			id: r.id,
			data: r.data ? JSON.parse(r.data) : null,
			deleted: r.deleted === 1
		}))
	});
}

export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url);
		if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request);

		try {
			if (url.pathname === '/api/auth/request' && request.method === 'POST') return await requestLink(request, env);
			if (url.pathname === '/api/auth/verify' && request.method === 'GET') return await verifyLink(url, env);
			if (url.pathname === '/api/auth/logout' && request.method === 'POST') return await logout(request, env);

			const user = await currentUser(request, env);
			if (!user) return json({ error: 'unauthorized' }, 401);
			if (url.pathname === '/api/me' && request.method === 'GET') return json({ email: user.email });
			if (url.pathname === '/api/sync' && request.method === 'POST') return await sync(request, env, user.id);
			return json({ error: 'not_found' }, 404);
		} catch (error) {
			console.error(error);
			return json({ error: 'server_error' }, 500);
		}
	}
} satisfies ExportedHandler<Env>;
