/**
 * Cloudflare Worker for ceylontrokitchen.com.
 *
 * The site itself is static (Astro, ./dist) and served straight from Workers static assets.
 * This Worker runs only for /api/* (see `run_worker_first` in wrangler.jsonc):
 *
 *   POST /api/checkout        start a Clover Hosted Checkout for a pickup order
 *   POST /api/clover-webhook  Clover's payment notification
 *   GET  /api/status          which Clover settings are present (true/false only, never values)
 */
import { handleCheckout, json } from './checkout.ts';
import { handleWebhook } from './webhook.ts';
import type { Env } from './env.ts';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);

    if (pathname === '/api/checkout') {
      return request.method === 'POST' ? handleCheckout(request, env) : json({ error: 'method_not_allowed' }, 405);
    }
    if (pathname === '/api/clover-webhook') {
      return request.method === 'POST' ? handleWebhook(request, env) : json({ error: 'method_not_allowed' }, 405);
    }
    if (pathname === '/api/status' && request.method === 'GET') {
      // Setup check: which Clover settings this deployment can see. Values are never shown.
      return json({
        ordering: true,
        cloverApi: env.CLOVER_API_BASE ?? null,
        merchantId: Boolean(env.CLOVER_MERCHANT_ID),
        privateToken: Boolean(env.CLOVER_PRIVATE_TOKEN),
        webhookSecret: Boolean(env.CLOVER_WEBHOOK_SECRET),
        orderStore: Boolean(env.ORDERS),
      });
    }
    if (pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);

    return env.ASSETS.fetch(request);
  },
};
