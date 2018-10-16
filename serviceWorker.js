var MAIN_CACHE="swcache_v6";
var CACHE_URLS = [
  '/index.html',
  '/restaurant.html',
  '/js/main.js',
  '/js/dbhelper.js',
  '/js/restaurant_info.js',
  '/css/styles.css',
  '/css/responsive.css',
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js'
];

console.log("sw normal run");

function precache() {
  return caches.open(MAIN_CACHE)
    .then(cache => {console.log("caching 000"); return cache.addAll(CACHE_URLS);});
}

function getFromNetwork(request){
  return fetch(request).catch(()=>{return new Response("Request failed!");});
}
function getFromCache(request){
  return caches.open(MAIN_CACHE).then((cache)=>cache.match(request));
}
function getFromCacheOrNet(request){
  return getFromCache(request).then((response)=>{return response || getFromNetwork(request);});
}

function updateCache(request){
  return caches.open(MAIN_CACHE).then((cache)=>{
    return fetch(request).then((response)=> cache.put(request, response));
  });
}

self.addEventListener('install', event => {
  console.log("Installing SW!");
  event.waitUntil(precache());
});

self.addEventListener('fetch', event =>{
  console.log("[SW] (serving)");
  event.respondWith(getFromCacheOrNet(event.request));
  event.waitUntil(updateCache(event.request));
});

