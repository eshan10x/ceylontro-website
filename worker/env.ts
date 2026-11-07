/**
 * Bindings and settings for the Worker. Secrets are set in Cloudflare (Workers → ceylontro-website
 * → Settings → Variables and secrets, or `wrangler secret put`), never in this repository.
 */

/** The parts of a Workers KV namespace this Worker uses. */
export interface OrderStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface Env {
  /** The static site (dist/), served for everything that isn't /api/*. */
  ASSETS: { fetch(request: Request): Promise<Response> };
  /** Clover API host: production, North America (https://api.clover.com), set in wrangler.jsonc. */
  CLOVER_API_BASE?: string;
  /** Secret: Ecommerce API private token (Hosted checkout integration). */
  CLOVER_PRIVATE_TOKEN?: string;
  /** Secret (pay at pickup): merchant API token with Orders read and write, for POS orders. */
  CLOVER_API_TOKEN?: string;
  /** The merchant's 13% HST tax rate in Clover (not secret; from the inventory export). */
  CLOVER_TAX_RATE_ID?: string;
  /** Secret: the merchant ID the token belongs to. */
  CLOVER_MERCHANT_ID?: string;
  /** Secret: Hosted Checkout webhook signing secret. */
  CLOVER_WEBHOOK_SECRET?: string;
  /** Optional KV namespace that keeps each order between checkout and Clover's webhook. */
  ORDERS?: OrderStore;
}
