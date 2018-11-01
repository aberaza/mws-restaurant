/**
 * Common database helper functions.
 */

const IMG_SIZES=[
  {suffix : "-small", width:320},
  {suffix: "-medium", width: 640},
  {suffix: "-large", width:800}];
const IMG_SUFFIX_RX=/(\.[\w\d]+)$/i;

const RESTAURANT_BY_ID = id => `${DBHelper.DATABASE_URL}/${id}`;
const RESTAURANT_BY_CUISINE = cuisine => `${DBHelper.DATABASE_URL}?cuisine_type=${cuisine}`;
const RESTAURANT_BY_NEIGHBORHOOD = neighborhood => `${DBHelper.DATABASE_URL}?neighborhood=${neighborhood}`;
const RESTAURANT_BY_CUISINE_AND_NEIGHBORHOOD = (cuisine, neighborhood) => `${DBHelper.DATABASE_URL}?cuisine_type=${cuisine}&neighborhood=${neighborhood}`;
const RESTAURANT_BY_FILTER = filter => `${DBHelper.DATABASE_URL}?${Object.keys(filter).map(key => `${key}=${filter[key]}`).join('&')}`;

function getJSON(url){
  return fetch(url).then(response => response.json());
}
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    // const port = 8000; // Change this to your server port
    // return `http://localhost:${port}/data/restaurants.json`;
    const port = 1337;
    return `http://localhost:${port}/restaurants`;
  }


  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    // let xhr = new XMLHttpRequest();
    console.log("XXX" + DBHelper.DATABASE_URL);
    // fetch(DBHelper.DATABASE_URL)
    getJSON(DBHelper.DATABASE_URL)
      .then(restaurants => callback(null, restaurants))
      .catch(error => callback(error, null));
    // xhr.open('GET', DBHelper.DATABASE_URL);
    // xhr.onload = () => {
    //   if (xhr.status === 200) { // Got a success response from server!
    //     const json = JSON.parse(xhr.responseText);
    //     const restaurants = json.restaurants;
    //     callback(null, restaurants);
    //   } else { // Oops!. Got an error from server.
    //     const error = (`Request failed. Returned status of ${xhr.status}`);
    //     callback(error, null);
    //   }
    // };
    // xhr.send();
  }

  /**
   * Fetch a restaurant by its ID.
   */
  static fetchRestaurantById(id, callback) {
    // fetch all restaurants with proper error handling.
    // fetch(RESTAURANT_BY_ID(id))
    getJSON(RESTAURANT_BY_ID(id))
      .then(restaurant => callback(null, restaurant))
      .catch(error => callback(error, null));

    // DBHelper.fetchRestaurants((error, restaurants) => {
    //   if (error) {
    //     callback(error, null);
    //   } else {
    //     const restaurant = restaurants.find(r => r.id == id);
    //     if (restaurant) { // Got the restaurant
    //       callback(null, restaurant);
    //     } else { // Restaurant does not exist in the database
    //       callback('Restaurant does not exist', null);
    //     }
    //   }
    // });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    getJSON(RESTAURANT_BY_CUISINE(cuisine))
      .then(restaurants => callback(null, restaurants))
      .catch(error => callback(error, null));
    // DBHelper.fetchRestaurants((error, restaurants) => {
    //   if (error) {
    //     callback(error, null);
    //   } else {
    //     // Filter restaurants to have only given cuisine type
    //     const results = restaurants.filter(r => r.cuisine_type == cuisine);
    //     callback(null, results);
    //   }
    // });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    getJSON(RESTAURANT_BY_NEIGHBORHOOD(neighborhood))
      .then(restaurants => callback(null, restaurants))
      .catch(error => callback(error, null));
    // DBHelper.fetchRestaurants((error, restaurants) => {
    //   if (error) {
    //     callback(error, null);
    //   } else {
    //     // Filter restaurants to have only given neighborhood
    //     const results = restaurants.filter(r => r.neighborhood == neighborhood);
    //     callback(null, results);
    //   }
    // });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    let filter = {};
    if(cuisine!='all'){
      filter.cuisine_type = cuisine;
    }
    if(neighborhood !='all'){
      filter.neighborhood = neighborhood;
    }
    getJSON(RESTAURANT_BY_FILTER(filter))
      .then(restaurants => callback(null, restaurants))
      .catch(error => callback(error, null));
    // Fetch all restaurants
    // DBHelper.fetchRestaurants((error, restaurants) => {
    // Restaurants((error, restaurants) => {
    //   if (error) {
    //     callback(error, null);
    //   } else {
    //     let results = restaurants
    //     if (cuisine != 'all') { // filter by cuisine
    //       results = results.filter(r => r.cuisine_type == cuisine);
    //     }
    //     if (neighborhood != 'all') { // filter by neighborhood
    //       results = results.filter(r => r.neighborhood == neighborhood);
    //     }
    //     callback(null, results);
    //   }
    // });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
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
    return IMG_SIZES.map((size)=> `/img/${restaurant.photograph}${size.suffix}.jpg ${size.width}w`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
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

