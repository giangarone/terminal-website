import { test } from 'node:test';
import assert from 'node:assert/strict';
import { connectMarketFeed, parseTicker, PRODUCTS } from '../src/market-feed.ts';
import type { FeedSnapshot, Product } from '../src/market-feed.ts';

// Test fixtures only. These values are never bundled into the homepage.
const ticker = (product: Product = 'BTC-USD', sequence = 1, price = '110') => ({
  type: 'ticker', product_id: product, price, open_24h: '100',
  time: '2026-10-13T20:00:00.000Z', sequence,
});

class FakeSocket extends EventTarget {
  sent: string[] = [];
  closed = false;
  send(value: string) { this.sent.push(value); }
  close() { this.closed = true; this.dispatchEvent(new Event('close')); }
  open() { this.dispatchEvent(new Event('open')); }
  message(value: unknown) {
    const event = new Event('message');
    Object.defineProperty(event, 'data', { value: JSON.stringify(value) });
    this.dispatchEvent(event);
  }
  fail() { this.dispatchEvent(new Event('error')); }
}

function setup() {
  const sockets: FakeSocket[] = [];
  const snapshots: FeedSnapshot[] = [];
  const stop = connectMarketFeed(snapshot => snapshots.push(snapshot), {
    socketFactory: () => {
      const socket = new FakeSocket();
      sockets.push(socket);
      return socket;
    },
  });
  return { sockets, snapshots, stop, latest: () => snapshots.at(-1)! };
}

test('parses prices and positive, negative, and unchanged 24-hour moves', () => {
  assert.ok(Math.abs(parseTicker(ticker())!.changePercent - 10) < 0.000001);
  assert.ok(Math.abs(parseTicker(ticker('ETH-USD', 1, '90'))!.changePercent + 10) < 0.000001);
  assert.equal(parseTicker(ticker('SOL-USD', 1, '100'))!.changePercent, 0);
  assert.equal(parseTicker(ticker())!.price, 110);
});

test('rejects malformed, unsupported, and invalid numeric messages', () => {
  for (const message of [
    null, [], 'ticker', {}, { ...ticker(), type: 'heartbeat' },
    { ...ticker(), product_id: 'FICTIONAL-USD' }, { ...ticker(), price: 'NaN' },
    { ...ticker(), price: true }, { ...ticker(), price: '' },
    { ...ticker(), price: '-5' }, { ...ticker(), open_24h: '0' },
    { ...ticker(), open_24h: Infinity }, { ...ticker(), time: 'bad-date' },
    { ...ticker(), sequence: -1 }, { ...ticker(), sequence: Number.MAX_SAFE_INTEGER + 1 },
  ]) assert.equal(parseTicker(message), null);
});

test('starts empty and subscribes to the public batch and heartbeat channels', t => {
  const feed = setup();
  t.after(feed.stop);
  assert.equal(feed.latest().status, 'connecting');
  assert.deepEqual(feed.latest().quotes, {});
  feed.sockets[0].open();
  assert.deepEqual(JSON.parse(feed.sockets[0].sent[0]), {
    type: 'subscribe', product_ids: PRODUCTS, channels: ['ticker_batch', 'heartbeat'],
  });
  feed.sockets[0].message(ticker());
  assert.equal(feed.latest().status, 'connecting');
  for (const product of PRODUCTS) feed.sockets[0].message(ticker(product));
  assert.equal(feed.latest().status, 'live');
});

test('ignores malformed JSON and out-of-order ticks without losing valid prices', t => {
  const feed = setup();
  t.after(feed.stop);
  const socket = feed.sockets[0];
  socket.message(ticker('BTC-USD', 5, '120'));
  socket.message(ticker('BTC-USD', 4, '80'));
  socket.message({ type: 'ticker', product_id: 'BTC-USD', price: 'broken' });
  const badEvent = new Event('message');
  Object.defineProperty(badEvent, 'data', { value: '{invalid json' });
  assert.doesNotThrow(() => socket.dispatchEvent(badEvent));
  assert.equal(feed.latest().quotes['BTC-USD']!.price, 120);
});

test('retains stale quotes after disconnect and returns live only after refreshing every asset', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  const feed = setup();
  t.after(feed.stop);
  for (const product of PRODUCTS) feed.sockets[0].message(ticker(product));
  feed.sockets[0].fail();
  assert.equal(feed.latest().status, 'stale');
  assert.equal(feed.latest().quotes['BTC-USD']!.price, 110);
  t.mock.timers.tick(1000);
  assert.equal(feed.sockets.length, 2);
  feed.sockets[1].message(ticker('BTC-USD', 2));
  assert.equal(feed.latest().status, 'stale');
  for (const product of PRODUCTS) feed.sockets[1].message(ticker(product, 2));
  assert.equal(feed.latest().status, 'live');
});

test('marks a silent feed stale after 15 seconds and reconnects', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  const feed = setup();
  t.after(feed.stop);
  for (const product of PRODUCTS) feed.sockets[0].message(ticker(product));
  t.mock.timers.tick(15_000);
  assert.equal(feed.latest().status, 'stale');
  assert.ok(feed.sockets[0].closed);
  t.mock.timers.tick(1000);
  assert.equal(feed.sockets.length, 2);
});

test('healthy heartbeats keep unchanged quotes live without announcing every heartbeat', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  const feed = setup();
  t.after(feed.stop);
  for (const product of PRODUCTS) feed.sockets[0].message(ticker(product));
  const count = feed.snapshots.length;
  for (let i = 0; i < 4; i++) {
    t.mock.timers.tick(10_000);
    for (const product of PRODUCTS) feed.sockets[0].message({ type: 'heartbeat', product_id: product });
  }
  assert.equal(feed.latest().status, 'live');
  assert.equal(feed.snapshots.length, count);
  assert.equal(feed.sockets.length, 1);
});

test('missing individual asset heartbeats cannot be hidden by another active asset', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  const feed = setup();
  t.after(feed.stop);
  for (const product of PRODUCTS) feed.sockets[0].message(ticker(product));
  t.mock.timers.tick(10_000);
  feed.sockets[0].message({ type: 'heartbeat', product_id: 'BTC-USD' });
  t.mock.timers.tick(5000);
  assert.equal(feed.latest().status, 'stale');
});

test('a feed that never returns prices stays empty and reports unavailable', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  const feed = setup();
  t.after(feed.stop);
  t.mock.timers.tick(15_000);
  assert.equal(feed.latest().status, 'unavailable');
  assert.deepEqual(feed.latest().quotes, {});
  assert.equal(feed.latest().updatedAt, null);
});

test('retries with exponential backoff capped at 30 seconds and avoids duplicate retries', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  const feed = setup();
  t.after(feed.stop);
  for (const delay of [1000, 2000, 4000, 8000, 16_000, 30_000, 30_000]) {
    const count = feed.sockets.length;
    const socket = feed.sockets.at(-1)!;
    socket.fail();
    socket.fail();
    t.mock.timers.tick(delay - 1);
    assert.equal(feed.sockets.length, count);
    t.mock.timers.tick(1);
    assert.equal(feed.sockets.length, count + 1);
  }
});

test('cleanup closes connections and cancels pending retries', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  const feed = setup();
  feed.sockets[0].fail();
  feed.stop();
  const count = feed.snapshots.length;
  t.mock.timers.tick(90_000);
  feed.sockets[0].message(ticker());
  assert.equal(feed.sockets.length, 1);
  assert.equal(feed.snapshots.length, count);
  assert.ok(feed.sockets[0].closed);
});

test('a blocked transport constructor reports unavailable and can be cleaned up', t => {
  t.mock.timers.enable({ apis: ['setTimeout', 'setInterval', 'Date'] });
  const snapshots: FeedSnapshot[] = [];
  const stop = connectMarketFeed(snapshot => snapshots.push(snapshot), {
    socketFactory: () => { throw new Error('Connection blocked'); },
  });
  assert.equal(snapshots.at(-1)!.status, 'unavailable');
  stop();
  t.mock.timers.tick(90_000);
  assert.equal(snapshots.length, 2);
});
