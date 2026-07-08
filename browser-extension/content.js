(function () {
  'use strict';

  function extractRepoSlug() {
    try {
      const host = window.location.hostname;
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (!path) return null;

      const segments = path.split('/').filter(Boolean);
      if (segments.length < 2) return null;

      if (host === 'github.com' || host === 'huggingface.co') {
        const owner = segments[0];
        const repo = segments[1];
        if (!owner || !repo) return null;
        return owner + '/' + repo;
      }

      return null;
    } catch {
      return null;
    }
  }

  function injectCard(slug) {
    const host = window.location.hostname;
    const card = document.createElement('div');
    card.id = 'ai-atlas-lookup-card';
    card.setAttribute('data-ai-atlas-slug', slug);
    card.style.cssText = [
      'position:fixed',
      'right:16px',
      'bottom:16px',
      'z-index:2147483647',
      'max-width:280px',
      'padding:12px 14px',
      'border-radius:8px',
      'background:#111827',
      'color:#f9fafb',
      "font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
      'font-size:13px',
      'line-height:1.4',
      'box-shadow:0 6px 20px rgba(0,0,0,0.35)',
      'border:1px solid #1f2937',
    ].join(';');

    const label = document.createElement('div');
    label.style.cssText = 'font-weight:600;margin-bottom:4px;';
    label.textContent = 'AI Atlas Lookup';

    const repo = document.createElement('div');
    repo.style.cssText =
      'opacity:0.8;margin-bottom:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;';
    repo.textContent = slug + ' (' + host + ')';

    const link = document.createElement('a');
    link.href = 'https://ai-atlas.dev';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'Open AI Atlas';
    link.style.cssText = 'color:#60a5fa;text-decoration:none;font-weight:500;';

    card.appendChild(label);
    card.appendChild(repo);
    card.appendChild(link);
    document.body.appendChild(card);
  }

  const slug = extractRepoSlug();
  if (slug) {
    injectCard(slug);
  }
})();
