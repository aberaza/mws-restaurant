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
    let cursor = index.openCursor(null, "nextunique").then(function iterateCursor(cursor){
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
  // static _fetchRestaurants(callback) {
  //   getJSON(DBHelper.DATABASE_URL)
  //     .then(restaurants => callback(null, restaurants))
  //     .catch(error => callback(error, null));
  //
  // }

  static fetchRestaurants(callback) {
    idbGetRestaurants()
      .then(restaurants => {
        if (restaurants.length === 0) {
          return getJSON(DBHelper.DATABASE_URL).then(idbAddRestaurants);
        }
        return restaurants;
      })
      .then(restaurants => callback(null, restaurants))
      .catch(error => callback(error, null));
  }
  /**
   * Fetch a restaurant by its ID.
   */
  // static fetchRestaurantById(id, callback) {
  //   getJSON(RESTAURANT_BY_ID(id))
  //     .then(restaurant => callback(null, restaurant))
  //     .catch(error => callback(error, null));
  // }
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
  // static fetchRestaurantByCuisine(cuisine, callback) {
  //   getJSON(RESTAURANT_BY_CUISINE(cuisine))
  //     .then(restaurants => callback(null, restaurants))
  //     .catch(error => callback(error, null));
  // }
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
  // static fetchRestaurantByNeighborhood(neighborhood, callback) {
  //   getJSON(RESTAURANT_BY_NEIGHBORHOOD(neighborhood))
  //     .then(restaurants => callback(null, restaurants))
  //     .catch(error => callback(error, null));
  // }
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
  // static fetchRestaurantByCuisineAndNeighborhood(cuisine="all", neighborhood="all", callback) {
  //   let filter = {};
  //   if (cuisine != "all") {
  //     filter.cuisine_type = cuisine;
  //   }
  //   if (neighborhood != "all") {
  //     filter.neighborhood = neighborhood;
  //   }
  //   getJSON(RESTAURANT_BY_FILTER(filter))
  //     .then(restaurants => callback(null, restaurants))
  //     .catch(error => callback(error, null));
  // }
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
  // static fetchNeighborhoods(callback) {
  //   DBHelper.fetchRestaurants((error, restaurants) => {
  //     if (error) {
  //       callback(error, null);
  //     } else {
  //       // Get all neighborhoods from all restaurants
  //       const neighborhoods = restaurants.map(
  //         (v, i) => restaurants[i].neighborhood
  //       );
  //       // Remove duplicates from neighborhoods
  //       const uniqueNeighborhoods = neighborhoods.filter(
  //         (v, i) => neighborhoods.indexOf(v) == i
  //       );
  //       callback(null, uniqueNeighborhoods);
  //     }
  //   });
  // }
  static fetchNeighborhoods(callback) {
    idbGetNeighborhoodList()
      .then(neighborhoods => callback(null, neighborhoods))
      .catch(callback)
  }
  /**
   * Fetch all cuisines with proper error handling.
   */
  // static fetchCuisines(callback) {
  //   // Fetch all restaurants
  //   DBHelper.fetchRestaurants((error, restaurants) => {
  //     if (error) {
  //       callback(error, null);
  //     } else {
  //       // Get all cuisines from all restaurants
  //       const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
  //       // Remove duplicates from cuisines
  //       const uniqueCuisines = cuisines.filter(
  //         (v, i) => cuisines.indexOf(v) == i
  //       );
  //       callback(null, uniqueCuisines);
  //     }
  //   });
  // }
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
    // return (`/img/${restaurant.photograph.replace(IMG_SUFFIX_RX, IMG_SIZES[0].suffix + '$1')}`);
    return `/img/${restaurant.photograph}${IMG_SIZES[0].suffix}.jpg`;
  }

  /**
   * Get full images srcset
   */

  static imageSrcsetForRestaurant(restaurant) {
    return IMG_SIZES.map(
      size => `/img/${restaurant.photograph}${size.suffix}.jpg ${size.width}w`
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


// let dbPromise = idb.open('test', 1, (upgradeDb) => {
//   let restaurants = upgradeDb.transaction.objectStore('restaurants');
//   restaurants.createIndex('cuisine', 'cuisine');
// });

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
