const { initializeApp } = require("firebase/app");
const {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  deleteUser,
  getUserByEmail,
  signOut,
} = require("firebase/auth");
const ENV = process.env.NODE_ENV || "development";

require("dotenv").config({
  path: `${__dirname}/../.env.${ENV}`,
});
const { APIKEY, PROJECTID, APPID } = process.env;
const firebaseConfig = {};

if (!APIKEY || !PROJECTID) {
  throw Error("Connection information missing⛔");
} else {
  firebaseConfig.apiKey = process.env.APIKEY;
  //   firebaseConfig.authDomain = process.env.AUTHDOMAIN;
  firebaseConfig.projectId = process.env.PROJECTID;
  //   firebaseConfig.storageBucket = process.env.STORAGEBUCKET;
  //   //   firebaseConfig.messagingSenderId = process.env.MESSAGINGSENDERID;
  //   firebaseConfig.appId = process.env.APPID;
  //   firebaseConfig.measurementId = process.env.MESUREMENTID;
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
module.exports = {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
  sendEmailVerification,
  getUserByEmail,
  signOut,
};
