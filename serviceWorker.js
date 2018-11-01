var MAIN_CACHE="swcache_v7k";
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

function _newResponse(content='', contentType='text/plain', status=503){
  const status2Text = { '503' : 'Service Unavailable'};
  return new Response( content, {
    status,
    statusText : status2Text[status],
    headers : new Headers({
      'Content-Type' : contentType
    })
  });
}

function _request2URL(request){
  return (new URL(request.url)).pathname;
}
/** CACHE IDB **/
var IMAGES_CACHE='contentImagesCache';

// let dbPromise = idb.open('test', 1, (upgradeDb) => {
//   let restaurants = upgradeDb.transaction.objectStore('restaurants');
//   restaurants.createIndex('cuisine', 'cuisine');
// });


// function getImages(request){
//   return getFromCache(request, IMAGES_CACHE)
//     .then(response => {
//       return response || updateCache(request, IMAGES_CACHE);
//     });
// }

// function cleanImages(){
//   return dbPromise.then( db => {
//     if (!db ){
//       return;
//     }

//     var tx = db.transacion('something');
//     return tx.objectStore('someobject').getAll().then(restaurants => {
//       restaurants.forEach(restaurant => {
//         var imagesNeeded = [];
//         if(restaurant.photo){
//           imagesNeedes.push(restaurant.photo);
//         }
//       });

//       return imagesNeeded;
//     }).then( imagesNeeded => {
//       caches.open(IMAGES_CACHE).then(cache => {
//         return cache.keys().then(requests => {
//           requests.forEach( request => {
//             let url = _request2URL(request);
//               if(!imagesNeeded.includes(url)){
//                 cache.delete(request);
//               }
//           });
//         });
//       })
//     });
//   });
// }



function precache(cacheName = MAIN_CACHE) {
  return caches.open(cacheName)
    .then(cache => { return cache.addAll(CACHE_URLS);});
}


function getFromNetwork(request){
  return fetch(request);
    // .catch(()=> _newResponse("<h1>Request failed!</h1>","text/html", 503));
}

function getFromCache(request, cacheName=MAIN_CACHE){
  return caches.open(cacheName).then((cache)=>cache.match(request));
}

//   return caches.open(MAIN_CACHE)
//     .then( cache => fetch(request)
//       .then(response => cache.put(request, response.clone())
//         .then(response)
//       )
//     );
// }

function getFromCacheOrNet(request){
  return getFromCache(request).then((response)=>{return response || getFromNetwork(request);});
}

function updateCache(request, cacheName = MAIN_CACHE){
  return caches.open(cacheName).then( cache =>
    fetch(request).then( response => { 
      cache.put(request, response.clone()); 
      return response;
    })
  );
}

self.addEventListener('install', event => {
  event.waitUntil(precache());
});

self.addEventListener('fetch', event =>{
  console.log("REQ:[" + event.request.destination + "] " + event.request.url);
  switch(event.request.destination){
    case 'image': //Get from cache and update
      event.respondWith(getFromCacheOrNet(event.request, IMAGES_CACHE));
      event.waitUntil(updateCache(event.request, IMAGES_CACHE));
      break;
    case 'font': //Get from cache
      event.respondWith(getFromCache(event.request));
      break;
      /* OTHER URL files, cache + network  */
    case 'style':
    case 'script':
    case 'document':
    default:
      event.respondWith(getFromCacheOrNet(event.request));
      event.waitUntil(updateCache(event.request));
      break;
  }
});

