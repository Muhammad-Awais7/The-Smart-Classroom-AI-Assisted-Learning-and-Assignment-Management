// src/firebase.js

import { initializeApp } from "firebase/app";

import {
  initializeAuth,
  browserLocalPersistence
} from "firebase/auth";

import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBKbXHSSBNNsBTK8mRmTbvTzAfibXHXnM8",
  authDomain: "smart-classroom-73c2b.firebaseapp.com",
  projectId: "smart-classroom-73c2b",
  storageBucket: "smart-classroom-73c2b.firebasestorage.app",
  messagingSenderId: "667172361340",
  appId: "1:667172361340:web:1e03cc48c798d5973f25f9",
  measurementId: "G-59YYSQCK4Y"
};

const app = initializeApp(firebaseConfig);

// Firebase Authentication
export const auth = initializeAuth(app, {
  persistence: browserLocalPersistence
});

// Student & Supervisor Auth
export const studentAuth = auth;
export const supervisorAuth = auth;

// Firestore
export const db = getFirestore(app);

// Storage
export const storage = getStorage(app);