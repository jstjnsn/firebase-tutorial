import * as dotenv from 'dotenv';
dotenv.config();

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.9.2/firebase-auth.js";
import {
  addDoc,
  collection,
  getFirestore,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "https://www.gstatic.com/firebasejs/9.9.2/firebase-firestore.js";

// INIT

const firebaseConfig = {
  apiKey: process.env.APIKEY,
  authDomain: process.env.AUTHDOMAIN,
  projectId: process.env.PROJECTID,
  storageBucket: process.env.STORAGEBUCKET,
  messagingSenderId: process.env.MESSAGINGSENDERID,
  appId: process.env.APPID,
  measurementId: process.env.MEASUREMENTID,
};

const app = initializeApp(firebaseConfig);
const authentication = getAuth(app);

// MODEL

const db = getFirestore(app);

let thingsRef;
let unsubscribe;

// VIEW

const $ = document.querySelector.bind(document);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const signedOutView = $("[data-v-signed-out]");
const signInButton = $("[data-c-sign-in]");
const signedInView = $("[data-v-signed-in]");
const signOutButton = $("[data-c-sign-out]");
const userDetailsView = $("[data-v-user-details]");
const thingsView = $("[data-v-things]");
const createThingButton = $("[data-c-create-thing]");

signInButton.onclick = async () => {
  try {
    await signInWithEmailAndPassword(
      authentication,
      "hello@joostjansen.me",
      "123456"
    );
  } catch (error) {
    console.error("Authentication error", error);
  }
};

signOutButton.onclick = async () => {
  try {
    await signOut(authentication);
  } catch (error) {
    console.error("Authentication error", error);
  }
};

// SUBSCRIPTION

const words = ["possum", "apple", "window", "banana", "house"];

function getRandomWord() {
  return words[Math.floor(Math.random() * words.length)];
}

onAuthStateChanged(
  authentication,
  async (user) => {
    if (user) {
      // signed in
      signedInView.style.display = "block";
      signedOutView.style.display = "none";

      userDetailsView.innerHTML = `<h3>Hello ${user.email}!</h3><p>${user.uid}</p>`;

      thingsRef = collection(db, "things");

      createThingButton.onclick = async () => {
        await addDoc(thingsRef, {
          uid: user.uid,
          name: getRandomWord(),
          createdAt: serverTimestamp(),
        });
      };

      const q = query(thingsRef, where("uid", "==", user.uid));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const items = [];
          snapshot.forEach((doc) => items.push(`<li>${doc.data().name}</li>`));
          thingsView.innerHTML = items.join("");
        },
        (error) => {
          console.error("Database error", error);
        }
      );
    } else {
      // signed out
      signedInView.style.display = "none";
      signedOutView.style.display = "block";

      userDetailsView.innerHTML = "";

      unsubscribe && unsubscribe();
    }
  },
  (error) => {
    // authentication error
    console.log("Authentication error", error);
  }
);
