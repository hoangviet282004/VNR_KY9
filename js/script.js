(function () {
  const slides = Array.from(document.querySelectorAll('.slide'));
  const total = slides.length;
  let current = 0;

  const progressFill = document.getElementById('progressFill');
  const slideCurrentEl = document.getElementById('slideCurrent');
  const slideTotalEl = document.getElementById('slideTotal');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const menuBtn = document.getElementById('menuBtn');
  const tocOverlay = document.getElementById('tocOverlay');
  const tocClose = document.getElementById('tocClose');
  const tocList = document.getElementById('tocList');

  slideTotalEl.textContent = total;

  // Build TOC, grouping by "part" divider slides
  const partNames = {
    '1': 'PHẦN 1 — ĐẠI HỘI VIII',
    '2': 'PHẦN 2 — ĐẠI HỘI IX',
    '3': 'PHẦN 3 — TỔNG KẾT'
  };
  slides.forEach((slide, i) => {
    if (slide.classList.contains('divider-slide')) {
      const part = slide.dataset.part;
      const div = document.createElement('div');
      div.className = 'toc-divider';
      div.textContent = partNames[part] || ('PHẦN ' + part);
      tocList.appendChild(div);
    }
    const entry = document.createElement('div');
    entry.className = 'toc-entry';
    entry.dataset.index = i;
    const title = slide.dataset.title || ('Slide ' + (i + 1));
    entry.innerHTML = `<span class="toc-idx">${i + 1}</span><span>${title}</span>`;
    entry.addEventListener('click', () => {
      goTo(i);
      closeToc();
    });
    tocList.appendChild(entry);
  });
  const tocEntries = Array.from(tocList.querySelectorAll('.toc-entry'));

  function render() {
    slides.forEach((slide, i) => {
      slide.classList.remove('active', 'prev-slide');
      if (i === current) slide.classList.add('active');
      else if (i < current) slide.classList.add('prev-slide');
    });
    slideCurrentEl.textContent = current + 1;
    progressFill.style.width = ((current + 1) / total * 100) + '%';
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === total - 1;
    tocEntries.forEach((el, i) => el.classList.toggle('active', i === current));
    const activeEntry = tocEntries[current];
    if (activeEntry) activeEntry.scrollIntoView({ block: 'nearest' });
    history.replaceState(null, '', '#' + (current + 1));
  }

  function goTo(index) {
    if (index < 0 || index >= total) return;
    current = index;
    render();
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function openToc() { tocOverlay.classList.add('open'); }
  function closeToc() { tocOverlay.classList.remove('open'); }
  function toggleToc() { tocOverlay.classList.toggle('open'); }

  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);
  menuBtn.addEventListener('click', toggleToc);
  tocClose.addEventListener('click', closeToc);
  tocOverlay.addEventListener('click', (e) => {
    if (e.target === tocOverlay) closeToc();
  });

  document.addEventListener('keydown', (e) => {
    if (tocOverlay.classList.contains('open')) {
      if (e.key === 'Escape') closeToc();
      return;
    }
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
      case ' ':
      case 'PageDown':
        e.preventDefault();
        next();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
      case 'PageUp':
        e.preventDefault();
        prev();
        break;
      case 'Home':
        e.preventDefault();
        goTo(0);
        break;
      case 'End':
        e.preventDefault();
        goTo(total - 1);
        break;
      case 'm':
      case 'M':
        openToc();
        break;
    }
  });

  // Basic swipe support
  let touchStartX = null;
  document.addEventListener('touchstart', (e) => { touchStartX = e.touches[0].clientX; }, { passive: true });
  document.addEventListener('touchend', (e) => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 60) { dx < 0 ? next() : prev(); }
    touchStartX = null;
  }, { passive: true });

  // Init from hash if present
  const hashIndex = parseInt((location.hash || '').replace('#', ''), 10);
  if (!isNaN(hashIndex) && hashIndex >= 1 && hashIndex <= total) {
    current = hashIndex - 1;
  }
  render();
})();
