function safe(url) {
  expect(typeof scope.safeLink, 'type of safeLink').toBe('function');
  return scope.safeLink(url);
}

test('accepts http and https addresses', () => {
  expect(safe('https://shop.example/lamp'), 'safeLink("https://shop.example/lamp")').toBe('https://shop.example/lamp');
  expect(safe('http://shop.example/items?category=home'), 'safeLink("http://shop.example/items?category=home")').toBe('http://shop.example/items?category=home');
});

test('returns the address as the URL API normalizes it', () => {
  expect(safe('HTTPS://Shop.Example/Lamp'), 'safeLink("HTTPS://Shop.Example/Lamp")').toBe('https://shop.example/Lamp');
});

test('refuses javascript: in any spelling', () => {
  for (const url of ['javascript:alert(1)', 'JavaScript:alert(1)', '  javascript:alert(1)', 'java\tscript:alert(1)']) {
    expect(safe(url), `safeLink(${JSON.stringify(url)})`).toBeNull();
  }
});

test('refuses other schemes and text that is not an address', () => {
  for (const url of ['data:text/html,<b>hi</b>', 'mailto:wishes@shop.example', 'ftp://shop.example/file', '/relative/path', '', null, undefined]) {
    expect(safe(url), `safeLink(${JSON.stringify(url) ?? 'undefined'})`).toBeNull();
  }
});

test('renderWish links only to safe addresses', () => {
  expect(typeof scope.renderWish, 'type of renderWish').toBe('function');
  const good = scope.renderWish({ id: 'w-04', name: L.book, shopLink: 'https://shop.example/book' });
  expect(good.querySelector('a')?.getAttribute('href'), 'href of a safe link').toBe('https://shop.example/book');
  expect(good.textContent, 'text of a safe link').toBe(L.book);
  const bad = scope.renderWish({ id: 'w-04', name: L.book, shopLink: 'javascript:alert(1)' });
  expect(bad.querySelector('a'), 'a link for a javascript: address').toBeNull();
  expect(bad.textContent, 'text shown instead of the link').toBe(L.book);
});

test('every link on the page uses http or https, and every wish is shown', () => {
  expect(screen.$$('#wishes li').map((item) => item.textContent), 'wishes on the page').toEqual([L.headphones, L.lamp, L.bicycle, L.tickets, L.mug]);
  const schemes = screen.$$('#wishes a').map((link) => new URL(link.href).protocol);
  expect(schemes, 'schemes of the links on the page').toEqual(['https:', 'http:']);
});
