/* Corrida do Rolo: service worker.
   - A página (index.html) vem SEMPRE da internet primeiro; a cópia guardada só é usada sem internet.
     Assim a atualização automática do jogo continua igual.
   - Imagens, figurinhas e ícones: usa o que está guardado e atualiza por trás (o jogo abre mais rápido).
   - Firebase, fontes e qualquer coisa de outro site: passa direto, sem mexer. */
const CACHE = "corrida-v1";
self.addEventListener("install", e => { self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith("corrida-") && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if(r.method !== "GET") return;
  const u = new URL(r.url);
  if(u.origin !== self.location.origin) return;
  const pagina = r.mode === "navigate" || /\.html?$/.test(u.pathname) || u.pathname.endsWith("/");
  if(pagina){
    e.respondWith(fetch(r).then(resp => {
      if(resp && resp.ok && r.mode === "navigate"){ const c = resp.clone(); caches.open(CACHE).then(ca => ca.put("./", c)).catch(() => {}); }
      return resp;
    }).catch(() => caches.match(r).then(m => m || caches.match("./"))));
    return;
  }
  if(/\.(png|jpe?g|webp|gif|svg|ico|webmanifest)$/i.test(u.pathname)){
    e.respondWith(caches.open(CACHE).then(ca => ca.match(r).then(m => {
      const rede = fetch(r).then(resp => { if(resp && resp.ok) ca.put(r, resp.clone()).catch(() => {}); return resp; });
      if(m){ rede.catch(() => {}); return m; }
      return rede;
    })));
  }
});
