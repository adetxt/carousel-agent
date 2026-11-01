// Brand chrome: adds header, footer and page numbers to every .slide.
// Include with <script src="kit/chrome.js"></script> at the end of <body>.
const BRAND = {
  logo: '', // relative to this file; leave empty for a generic kit
  name: '', // set when using a brand; omit when the logo contains the wordmark
  handle: '', // optional; leave empty for a generic kit
};

(() => {
  const logoUrl = BRAND.logo && new URL(BRAND.logo, document.currentScript.src).href;
  const slides = document.querySelectorAll('.slide');
  slides.forEach((slide, i) => {
    const header = document.createElement('header');
    header.className = 'brand-header';
    if (logoUrl) {
      const img = document.createElement('img');
      img.className = 'logo';
      img.src = logoUrl;
      img.alt = '';
      header.append(img);
    }
    if (BRAND.name) {
      const name = document.createElement('span');
      name.className = 'name';
      name.textContent = BRAND.name;
      header.append(name);
    }

    const footer = document.createElement('footer');
    footer.className = 'brand-footer';
    const handle = document.createElement('span');
    handle.textContent = BRAND.handle;
    const page = document.createElement('span');
    page.className = 'page';
    page.textContent = `${i + 1} / ${slides.length}${i < slides.length - 1 ? ' →' : ''}`;
    footer.append(handle, page);

    slide.prepend(header);
    slide.append(footer);
  });
})();
