const CACHE_NAME = "Almost-v26.11.15.6";
const PRECACHE = [
  "./",
  "index.html",
  "code.css",
  "code.js",
  "theme/modern.css",
  "data.js",
  "manifest.json",
  "external_functions/marked.umd.js",
  "front/Monocraft.woff2",
  "front/Monocraft-Bold.woff2",
  "lang/en_us.lang",
  "lang/es_es.lang",
  "lang/es_mx.lang",
  "lang/pt_br.lang",
  "lang/fr_fr.lang",
  "lang/de_de.lang",
  "help_menu/en_us.md",
  "help_menu/es_es.md",
  "help_menu/es_mx.md",
  "help_menu/pt_br.md",
  "help_menu/fr_fr.md",
  "help_menu/de_de.md",
  "assets/favicon.ico",
  "assets/tab_icon.gif",
  "assets/search.png",
  "assets/filter.png",
  "assets/filter_action.png",
  "assets/close.png",
  "assets/close_action.png",
  "assets/app_icon/x192.png",
  "assets/app_icon/x512.png",
  "assets/items/axe.png",
  "assets/items/boots.png",
  "assets/items/bow.png",
  "assets/items/chestplate.png",
  "assets/items/crossbow.png",
  "assets/items/fishing_rod.png",
  "assets/items/helmet.png",
  "assets/items/hoe.png",
  "assets/items/leggings.png",
  "assets/items/mace.png",
  "assets/items/pickaxe.png",
  "assets/items/shovel.png",
  "assets/items/spear.png",
  "assets/items/sword.png",
  "assets/items/trident.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => clients.claim()),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET" || event.request.headers.has("range")) {
    return;
  }
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request, { ignoreSearch: true });
      const network = fetch(event.request)
        .then((response) => {
          if (response.ok && response.status !== 206) {
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});