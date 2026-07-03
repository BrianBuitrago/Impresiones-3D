import type { FirebaseApp } from "firebase/app";
import type { Firestore } from "firebase/firestore";
import type { Auth } from "firebase/auth";
import type { FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isBrowser = typeof window !== 'undefined';

let _app: FirebaseApp = undefined as unknown as FirebaseApp;
let _db: Firestore = undefined as unknown as Firestore;
let _auth: Auth = undefined as unknown as Auth;
let _storage: FirebaseStorage = undefined as unknown as FirebaseStorage;

if (isBrowser) {
  // Dynamic imports ensure Firebase SDK is NOT loaded on the server
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initializeApp, getApps, getApp } = require("firebase/app");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getFirestore } = require("firebase/firestore");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getAuth } = require("firebase/auth");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getStorage } = require("firebase/storage");

  _app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  _db = getFirestore(_app);
  _auth = getAuth(_app);
  _storage = getStorage(_app);
}

export { _app as app, _db as db, _auth as auth, _storage as storage };
export default _app;
