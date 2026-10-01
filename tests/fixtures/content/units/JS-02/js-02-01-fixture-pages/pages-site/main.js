// Report which images actually loaded once the page has finished loading.
window.addEventListener('load', () => {
  for (const img of document.querySelectorAll('img')) {
    console.log(img.id, img.complete && img.naturalWidth > 0 ? 'loaded' : 'not loaded');
  }
  const badge = getComputedStyle(document.querySelector('.badge')).backgroundImage;
  const inline = getComputedStyle(document.querySelector('.inline-badge')).backgroundImage;
  console.log('css backgrounds', badge.startsWith('url("blob:'), inline.startsWith('url("blob:'));
});
console.log('home page');
