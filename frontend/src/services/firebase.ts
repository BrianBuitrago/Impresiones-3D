import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const isBrowser = typeof window !== 'undefined';

const app: FirebaseApp = isBrowser ? (!getApps().length ? initializeApp(firebaseConfig) : getApp()) : ({} as FirebaseApp);
const db: Firestore = isBrowser ? getFirestore(app) : ({} as Firestore);
const auth: Auth = isBrowser ? getAuth(app) : ({} as Auth);
const storage: FirebaseStorage = isBrowser ? getStorage(app) : ({} as FirebaseStorage);

export { app, db, auth, storage };
export default app;
