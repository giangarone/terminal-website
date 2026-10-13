export const PRODUCTS = ['BTC-USD', 'ETH-USD', 'SOL-USD'] as const;
export type Product = (typeof PRODUCTS)[number];
export type FeedStatus = 'connecting' | 'live' | 'stale' | 'unavailable';

export interface Quote {
  product: Product;
  price: number;
  changePercent: number;
  time: number;
  sequence: number;
}

export interface FeedSnapshot {
  status: FeedStatus;
  quotes: Partial<Record<Product, Quote>>;
  updatedAt: number | null;
}

interface FeedSocket {
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
  send(data: string): void;
  close(): void;
}

interface FeedOptions {
  socketFactory?: (url: string) => FeedSocket;
  now?: () => number;
}

const ENDPOINT = 'wss://ws-feed.exchange.coinbase.com';
const STALE_AFTER = 15_000;
const MAX_BACKOFF = 30_000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isProduct(value: unknown): value is Product {
  return typeof value === 'string' && PRODUCTS.includes(value as Product);
}

function positiveNumber(value: unknown): number | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

/** Coinbase's ticker and ticker_batch channels share this message shape. */
export function parseTicker(value: unknown): Quote | null {
  if (!isRecord(value) || value.type !== 'ticker' || !isProduct(value.product_id)) return null;
  const price = positiveNumber(value.price);
  const open = positiveNumber(value.open_24h);
  const time = typeof value.time === 'string' ? Date.parse(value.time) : NaN;
  const sequence = value.sequence;
  if (price === null || open === null || !Number.isFinite(time)
    || typeof sequence !== 'number' || !Number.isSafeInteger(sequence) || sequence < 0) return null;

  const changePercent = ((price - open) / open) * 100;
  if (!Number.isFinite(changePercent)) return null;
  return { product: value.product_id, price, changePercent, time, sequence };
}

/** One connection for all three assets. Returned cleanup cancels every timer/listener. */
export function connectMarketFeed(
  onUpdate: (snapshot: FeedSnapshot) => void,
  options: FeedOptions = {},
): () => void {
  const createSocket = options.socketFactory ?? ((url: string) => new WebSocket(url));
  const now = options.now ?? Date.now;
  let stopped = false;
  let socket: FeedSocket | null = null;
  let detach: (() => void) | null = null;
  let retryTimer: ReturnType<typeof setTimeout> | undefined;
  let watchdog: ReturnType<typeof setInterval> | undefined;
  let attempts = 0;
  let status: FeedStatus = 'connecting';
  let updatedAt: number | null = null;
  const quotes: Partial<Record<Product, Quote>> = {};

  const emit = () => onUpdate({ status, quotes: { ...quotes }, updatedAt });
  const changeStatus = (next: FeedStatus) => {
    if (next === status) return;
    status = next;
    emit();
  };

  function cleanConnection() {
    clearInterval(watchdog);
    watchdog = undefined;
    detach?.();
    detach = null;
    const previous = socket;
    socket = null;
    try { previous?.close(); } catch { /* A failed transport may already be closed. */ }
  }

  function reconnect() {
    if (stopped || retryTimer !== undefined) return;
    cleanConnection();
    changeStatus(Object.keys(quotes).length ? 'stale' : 'unavailable');
    const delay = Math.min(1000 * 2 ** Math.min(attempts++, 5), MAX_BACKOFF);
    retryTimer = setTimeout(() => {
      retryTimer = undefined;
      connect();
    }, delay);
  }

  function connect() {
    if (stopped) return;
    const connectedAt = now();
    const lastActivity: Partial<Record<Product, number>> = {};
    const refreshed = new Set<Product>();
    let current: FeedSocket;
    try {
      current = createSocket(ENDPOINT);
      socket = current;
    } catch {
      reconnect();
      return;
    }

    const healthy = () => PRODUCTS.every(product => refreshed.has(product)
      && now() - (lastActivity[product] ?? connectedAt) < STALE_AFTER);

    const onOpen = () => {
      try {
        current.send(JSON.stringify({
          type: 'subscribe', product_ids: PRODUCTS, channels: ['ticker_batch', 'heartbeat'],
        }));
      } catch { reconnect(); }
    };

    const onMessage: EventListener = (event) => {
      let message: unknown;
      const data: unknown = (event as MessageEvent).data;
      if (typeof data !== 'string') return;
      try { message = JSON.parse(data); } catch { return; }
      if (!isRecord(message)) return;
      if (message.type === 'error') { reconnect(); return; }

      if (message.type === 'heartbeat' && isProduct(message.product_id)) {
        lastActivity[message.product_id] = now();
        return;
      }

      const quote = parseTicker(message);
      if (!quote) return;
      const previous = quotes[quote.product];
      // Ignore older messages, but accept an equal sequence as a reconnect snapshot.
      if (previous && quote.sequence < previous.sequence) return;
      quotes[quote.product] = quote;
      refreshed.add(quote.product);
      lastActivity[quote.product] = now();
      updatedAt = now();
      if (healthy()) { status = 'live'; attempts = 0; }
      emit();
    };

    const onFailure = () => reconnect();
    current.addEventListener('open', onOpen);
    current.addEventListener('message', onMessage);
    current.addEventListener('close', onFailure);
    current.addEventListener('error', onFailure);
    detach = () => {
      current.removeEventListener('open', onOpen);
      current.removeEventListener('message', onMessage);
      current.removeEventListener('close', onFailure);
      current.removeEventListener('error', onFailure);
    };

    watchdog = setInterval(() => {
      if (PRODUCTS.some(product => now() - (lastActivity[product] ?? connectedAt) >= STALE_AFTER)
        || (refreshed.size < PRODUCTS.length && now() - connectedAt >= STALE_AFTER)) reconnect();
    }, 1000);
  }

  emit();
  connect();
  return () => {
    stopped = true;
    clearTimeout(retryTimer);
    retryTimer = undefined;
    cleanConnection();
  };
}
