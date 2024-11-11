var admin = require("firebase-admin");

var serviceAccount = require("./firebase.json");

const firebaseAdmin = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
module.exports = firebaseAdmin
