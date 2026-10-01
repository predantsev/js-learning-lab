// An image whose src is assigned from JavaScript, as DOM lessons do.
const dynamic = new Image();
dynamic.id = 'dynamic';
dynamic.alt = 'Логотип, доданий кодом';
dynamic.addEventListener('load', () => console.log('dynamic load event'));
dynamic.addEventListener('error', () => console.log('dynamic error event'));
dynamic.src = 'img/logo.svg';
document.body.append(dynamic);

// Report which images actually loaded once the page has finished loading.
window.addEventListener('load', () => {
  for (const img of document.querySelectorAll('img:not(#dynamic)')) {
    console.log(img.id, img.complete && img.naturalWidth > 0 ? 'loaded' : 'not loaded');
  }
  const badge = getComputedStyle(document.querySelector('.badge')).backgroundImage;
  const inline = getComputedStyle(document.querySelector('.inline-badge')).backgroundImage;
  console.log('css backgrounds', badge.includes('data:image/svg+xml'), inline.includes('data:image/svg+xml'));
});
console.log('home page');
