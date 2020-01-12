import firebase from 'firebase-admin';
var serviceAccount = require('./serviceAccountKey.json');

export default firebase.initializeApp({
  credential: firebase.credential.cert(serviceAccount),
  databaseURL: "https://smartytaskapp-5763b.firebaseio.com"
});