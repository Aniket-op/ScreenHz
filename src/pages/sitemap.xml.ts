import type { APIRoute } from 'astro';

const pages = [
  // Core pages
  { url: '/',            priority: '1.0', changefreq: 'weekly'  },
  { url: '/benchmark',   priority: '0.9', changefreq: 'monthly' },
  { url: '/about',       priority: '0.6', changefreq: 'monthly' },
  { url: '/leaderboard', priority: '0.7', changefreq: 'daily'   },

  // Refresh rate & timing
  { url: '/refresh-rate',     priority: '0.9', changefreq: 'monthly' },
  { url: '/phone-hz-test',    priority: '0.9', changefreq: 'monthly' },
  { url: '/vrr-simulation',   priority: '0.7', changefreq: 'monthly' },
  { url: '/stutter-tearing',  priority: '0.7', changefreq: 'monthly' },
  { url: '/frame-skipping',   priority: '0.7', changefreq: 'monthly' },
  { url: '/browser-timing',   priority: '0.6', changefreq: 'monthly' },
  { url: '/blur-busters-law', priority: '0.6', changefreq: 'monthly' },

  // Motion tests
  { url: '/video-game-motion',     priority: '0.7', changefreq: 'monthly' },
  { url: '/vertical-scrolling',    priority: '0.7', changefreq: 'monthly' },
  { url: '/marquee',               priority: '0.6', changefreq: 'monthly' },
  { url: '/black-frame-insertion', priority: '0.6', changefreq: 'monthly' },
  { url: '/persistence',           priority: '0.6', changefreq: 'monthly' },
  { url: '/eye-tracking-blur',     priority: '0.6', changefreq: 'monthly' },
  { url: '/phantom-array',         priority: '0.6', changefreq: 'monthly' },
  { url: '/chase-squares',         priority: '0.6', changefreq: 'monthly' },

  // Latency & Input
  { url: '/reaction-time',   priority: '0.8', changefreq: 'monthly' },
  { url: '/mouse-poll-rate', priority: '0.8', changefreq: 'monthly' },
  { url: '/aim-trainer',     priority: '0.7', changefreq: 'monthly' },
  { url: '/dpi-calculator',  priority: '0.7', changefreq: 'monthly' },

  // Display tests
  { url: '/ghosting',           priority: '0.7', changefreq: 'monthly' },
  { url: '/hdr',                priority: '0.7', changefreq: 'monthly' },
  { url: '/black-levels',       priority: '0.6', changefreq: 'monthly' },
  { url: '/white-levels',       priority: '0.6', changefreq: 'monthly' },
  { url: '/color-ghosting',     priority: '0.6', changefreq: 'monthly' },
  { url: '/chroma-subsampling', priority: '0.6', changefreq: 'monthly' },
  { url: '/screen-resolution',  priority: '0.9', changefreq: 'monthly' },
  { url: '/resolution-scaling', priority: '0.6', changefreq: 'monthly' },
  { url: '/local-dimming',      priority: '0.6', changefreq: 'monthly' },
  { url: '/rtings-test',        priority: '0.6', changefreq: 'monthly' },

  // Response time
  { url: '/gtg-vs-mprt',        priority: '0.6', changefreq: 'monthly' },
  { url: '/mprt',               priority: '0.6', changefreq: 'monthly' },
  { url: '/lcd-pixel-response', priority: '0.6', changefreq: 'monthly' },
  { url: '/moving-line',        priority: '0.6', changefreq: 'monthly' },
  { url: '/moving-photo',       priority: '0.6', changefreq: 'monthly' },

  // Visual artifacts
  { url: '/aliasing',            priority: '0.6', changefreq: 'monthly' },
  { url: '/strobe-crosstalk',    priority: '0.6', changefreq: 'monthly' },
  { url: '/inversion-artifacts', priority: '0.6', changefreq: 'monthly' },
  { url: '/scan-out',            priority: '0.6', changefreq: 'monthly' },
  { url: '/scan-out-skew',       priority: '0.6', changefreq: 'monthly' },
  { url: '/flicker',             priority: '0.6', changefreq: 'monthly' },
  { url: '/crt-simulator',       priority: '0.6', changefreq: 'monthly' },
  { url: '/video-interlacing',   priority: '0.6', changefreq: 'monthly' },

  // Utilities
  { url: '/setup-score',   priority: '0.6', changefreq: 'monthly' },
  { url: '/color-rainbow', priority: '0.5', changefreq: 'monthly' },

  // Guides
  { url: '/guides',                      priority: '0.8', changefreq: 'weekly'  },
  { url: '/guides/what-is-refresh-rate', priority: '0.8', changefreq: 'monthly' },
  { url: '/guides/mouse-dpi',            priority: '0.7', changefreq: 'monthly' },
  { url: '/guides/improve-fps',          priority: '0.7', changefreq: 'monthly' },
  { url: '/guides/poll-rate',            priority: '0.7', changefreq: 'monthly' },
  { url: '/guides/gsync-vs-freesync',    priority: '0.7', changefreq: 'monthly' },
  { url: '/guides/motion-blur',          priority: '0.7', changefreq: 'monthly' },
];

export const GET: APIRoute = () => {
  const base    = 'https://screenhz.com';
  const lastmod = new Date().toISOString().split('T')[0];

  const urlEntries = pages
    .map(({ url, priority, changefreq }) =>
      `  <url>\n    <loc>${base}${url}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
          http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
};
