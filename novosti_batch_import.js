(async () => {
  try {
    const channelUrl = 'https://t.me/s/NovostiMoskvbl';
    const endpointBase = 'https://importtelegrambyurl-fdrlqmj3vq-uc.a.run.app?url=';

    const res = await fetch(channelUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7'
      }
    });
    const html = await res.text();

    const idMatches = Array.from(html.matchAll(/https:\/\/t\.me\/NovostiMoskvbl\/(\d+)/g)).map(m => m[1]);
    const uniqueIds = Array.from(new Set(idMatches));
    const sortedIdsDesc = uniqueIds.map(n => parseInt(n, 10)).filter(Number.isFinite).sort((a,b) => b - a);
    const last10 = sortedIdsDesc.slice(0, 10);

    const results = [];
    for (const id of last10) {
      const postUrl = `https://t.me/NovostiMoskvbl/${id}`;
      const url = endpointBase + encodeURIComponent(postUrl);
      try {
        const r = await fetch(url, { method: 'GET' });
        const data = await r.json();
        results.push({ url: postUrl, ok: !!data.success, saved: data.saved ?? 0, draft: !!data.draft });
      } catch (e) {
        results.push({ url: postUrl, ok: false, saved: 0, draft: false, error: e.message });
      }
    }

    console.log(JSON.stringify({ count: results.length, results }, null, 2));
  } catch (e) {
    console.error('batch_import_error', e);
    process.exit(1);
  }
})();


