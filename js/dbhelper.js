/**
 * Common database helper functions.
 */

const IMG_SIZES = [
  { suffix: "-small", width: 320 },
  { suffix: "-medium", width: 640 },
  { suffix: "-large", width: 800 }
];
// const IMG_SUFFIX_RX=/(\.[\w\d]+)$/i;

const RESTAURANT_BY_ID = id => `${DBHelper.DATABASE_URL}/${id}`;
const RESTAURANT_BY_CUISINE = cuisine =>
  `${DBHelper.DATABASE_URL}?cuisine_type=${cuisine}`;
const RESTAURANT_BY_NEIGHBORHOOD = neighborhood =>
  `${DBHelper.DATABASE_URL}?neighborhood=${neighborhood}`;
const RESTAURANT_BY_FILTER = filter =>
  `${DBHelper.DATABASE_URL}?${Object.keys(filter)
    .map(key => `${key}=${filter[key]}`)
    .join("&")}`;

function getJSON(url) {
  return fetch(url).then(response => response.json());
}

/****************************************** 
 * IDB CACHE
 ******************************************/
const DB_VER = 1;
let dbPromise = idb.open("mwsrestaurant", DB_VER, upgradeDb => {
  switch (upgradeDb.oldVersion) {
  case 0:
    const restaurants = upgradeDb.createObjectStore("restaurants", {
      keyPath: "id"
    });
    restaurants.createIndex("cuisines", "cuisine_type", { unique: false, multiEntry : false });
    restaurants.createIndex("neighborhoods", "neighborhood", { unique: false, multiEntry : true });
    break;
  } 
}); 

function idbAddRestaurant(restaurant) {
  return dbPromise.then(db => {
    let tx = db.transaction("restaurants", "readwrite");
    let store = tx.objectStore("restaurants");
    store.put(restaurant);
    // return tx.complete;
    return restaurant;
  });
}

function idbAddRestaurants(restaurants) {
  return dbPromise.then(db => {
    let tx = db.transaction("restaurants", "readwrite");
    let store = tx.objectStore("restaurants");
    restaurants.forEach(restaurant => store.put(restaurant));
    // return tx.complete;
    return restaurants;
  });
}

function idbDeleteRestaurant(restaurant) {
  return dbPromise.then(db => {
    let tx = db.transaction("restaurants", "readwrite");
    let store = tx.objectStore("restaurants");
    store.delete(restaurant);
    return tx.complete;
  });
}

function idbGetCuisineList() {
  return dbPromise.then(db => {
    let tx = db.transaction("restaurants", "readonly");
    let store = tx.objectStore("restaurants");
    let index = store.index("cuisines");
    let cuisines = [];
    let cursor = index.openCursor(null, "nextunique").then(function iterateCursor(cursor){
      if(!cursor) return;

      cuisines.push(cursor.value.cuisine_type);
      return cursor.continue().then(iterateCursor);
    });
    return tx.complete.then(() => { return cuisines; });
  });
}

function idbGetNeighborhoodList() {
  return dbPromise.then(db => {
    let tx = db.transaction("restaurants", "readonly");
    let store = tx.objectStore("restaurants");
    let index = store.index("neighborhoods");
    let cuisines = [];
    index.openCursor(null, "nextunique").then(function iterateCursor(cursor){
      if(!cursor) return;

      cuisines.push(cursor.value.neighborhood);
      return cursor.continue().then(iterateCursor);
    });
    return tx.complete.then(() => { return cuisines; });
  });
}

function idbGetRestaurantByID(id) {
  return dbPromise.then(db => {
    let tx = db.transaction("restaurants", "readonly");
    let store = tx.objectStore("restaurants");
    return store.get(id);
  });
}

function idbGetRestaurantsByCuisine(cuisine) {
  return dbPromise.then(db => {
    let tx = db.transaction("restaurants", "readonly");
    let store = tx.objectStore("restaurants");
    let index = store.index("cuisines");
    return index.getAll(cuisine);
  });
}

function idbGetRestaurantsByNeighborhood(neighborhood) {
  return dbPromise.then(db => {
    let tx = db.transaction("restaurants", "readonly");
    let store = tx.objectStore("restaurants");
    let index = store.index("neighborhoods");
    return index.getAll(neighborhood);
  });
}

function idbGetRestaurants() {
  return dbPromise.then(db => {
    let tx = db.transaction("restaurants", "readonly");
    let store = tx.objectStore("restaurants");
    return store.getAll();
  });
}

class DBHelper {
  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337;
    return `http://localhost:${port}/restaurants`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    fetchFromNet = false;
    idbGetRestaurants()
      .then(restaurants => {
        if (restaurants.length === 0) {
          fetchFromNet = true;
          return getJSON(DBHelper.DATABASE_URL);
        }
        return restaurants;
      })
      .then(restaurants => { callback(null, restaurants); return restaurants;})
      .then(restaurants => {
        if(fetchFromNet) return idbAddRestaurants(restaurants);
        return getJSON(DBHelper.DATABASE_URL).then(idbAddRestaurants);
      })
      .catch(error => callback(error, null));

  }
  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    idbGetRestaurantByID(id)
      .then(restaurant => {
        return (
          restaurant || getJSON(RESTAURANT_BY_ID(id)).then(idbAddRestaurant)
        );
      })
      .then(restaurants => callback(null, restaurants))
      .catch(error => callback(error, null));
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    idbGetRestaurantsByCuisine(cuisine)
      .then(restaurants => {
        if(restaurants.length !== 0){
          return getJSON(RESTAURANT_BY_CUISINE(cuisine)).then(idbAddRestaurants);
        }
        return restaurants;
      })
      .then(restaurants => callback(null, restaurants))
      .catch(error => callback(error, null));
  }


  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    idbGetRestaurantsByNeighborhood(neighborhood)
      .then(restaurants => {
        if(restaurants.length !== 0){
          return getJSON(RESTAURANT_BY_NEIGHBORHOOD(neighborhood)).then(idbAddRestaurants);
        }
        return restaurants;
      })
      .then(restaurants => callback(null, restaurant))
      .catch(error => callback(error, null));
  }
  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine="all", neighborhood="all", callback) {
    let results;
    if(cuisine != "all"){
      results = idbGetRestaurantsByCuisine(cuisine)
        .then(restaurants => {
          if(neighborhood != "all"){
            return restaurants.filter(resto => resto.neighborhood == neighborhood);
          }
          return restaurants;
        });
      results = idbGetRestaurantsByNeighborhood(neighborhood);
    }else{
      results = idbGetRestaurants();
    }
    results.then(restaurants => callback(null, restaurants))
      .catch(callback);
  }
        
  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    idbGetNeighborhoodList()
      .then(neighborhoods => callback(null, neighborhoods))
      .catch(callback)
  }
  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    idbGetCuisineList()
      .then(cuisines => callback(null, cuisines))
      .catch(callback)
  }
  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return `./restaurant.html?id=${restaurant.id}`;
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return `/img/${restaurant.photograph || "nopic"}${IMG_SIZES[0].suffix}.${restaurant.photograph?"jpg":"png"}`;
  }

  /**
   * Get full images srcset
   */

  static imageSrcsetForRestaurant(restaurant) {
    return IMG_SIZES.map(
      size => `/img/${restaurant.photograph || "nopic"}${size.suffix}.${restaurant.photograph?"jpg":"png"} ${size.width}w`
    );
  }

  /**
   * Map marker for a restaurant.
   */
  static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker
    const marker = new L.marker(
      [restaurant.latlng.lat, restaurant.latlng.lng],
      {
        title: restaurant.name,
        alt: restaurant.name,
        url: DBHelper.urlForRestaurant(restaurant)
      }
    );
    marker.addTo(newMap);
    return marker;
  }
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */
}

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
