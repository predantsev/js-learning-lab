// The wishlist server. It imports the shared contract for its types.
import http from 'node:http';
import type { WishV1, WishV2 } from './contract.ts';

type Stored = { id: string; name: string; price: number | null; acquired: boolean };

export function createServer() {
  const wishes: Stored[] = [
    { id: 'w-01', name: '%%headphones%%', price: 80, acquired: false },
    { id: 'w-05', name: '%%tickets%%', price: null, acquired: false },
  ];
  // How a stored wish turns into the answer of each version.
  const toV1 = (wish: Stored): WishV1 => ({ id: wish.id, name: wish.name, price: wish.price, acquired: wish.acquired });
  // const toV2 = (wish: Stored): WishV2 => ({ id: wish.id, name: wish.name, priceUah: wish.price, acquired: wish.acquired });
  const versions: Record<string, (wish: Stored) => unknown> = {
    v1: toV1,
    // v2: toV2,
  };

  return http.createServer((request, response) => {
    const [version, collection] = (request.url ?? '').split('/').filter((part) => part !== '');
    const toVersion = versions[version];
    const found = collection === 'records' && toVersion !== undefined;
    response.writeHead(found ? 200 : 404, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(found ? wishes.map(toVersion) : { error: { code: 'NOT_FOUND' } }));
  });
}
