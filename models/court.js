/**
 * Potential Api for server side fetching of Google API data 
 * 
 * Currently app is fetching Google API data client-side using 
 * Google Maps Javascript API
 * 
 * May need to switch in the future, because client-side fetching alots 
 * less freedom in handling uncaught errors in promise
 */






// const axios = require('axios')

// const api_key = `AIzaSyApojF0t8e5G5hTZuwtV3D_3Rimwd2M-NE`
// const BASE_URL = `https://maps.googleapis.com/maps/api/place/nearbysearch/json`;

// /** API Class.
//  *
//  * Static class tying together methods used to get/send to to the API.
//  *
//  */

// class Court {
//   // the token for interactive with the API will be stored here.
//   static api_key = `AIzaSyApojF0t8e5G5hTZuwtV3D_3Rimwd2M-NE`;

//   static async request({lat, lng}) {

//     const url = `${BASE_URL}`;
//     const params = {
//         key: api_key, 
//         keyword: 'basketball courts',
//         rankBy: 'distance',
//         radius: 50000,
//         location: `${lat},${lng}`
//     }
//     const method = 'get'
//     const headers = {"Access-Control-Allow-Origin": "http://localhost:3000"}

//     try {
//       return (await axios({ url, method, params, headers })).data;
//     } catch (err) {
//       console.log("API Error:", err.response);
//       let message = err.response.data.error.message;
//       throw Array.isArray(message) ? message : [message];
//     }
//   }

//   static async get(location){
//       let res = await this.request(location)
//       return res
//   }

// }



// module.exports = Court