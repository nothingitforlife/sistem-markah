// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDLMPfsGJhn_byk2DAR3ZlDFew04XgPLUM",
  authDomain: "sistem-markah-tkr.firebaseapp.com",
  projectId: "sistem-markah-tkr",
  storageBucket: "sistem-markah-tkr.firebasestorage.app",
  messagingSenderId: "874279748136",
  appId: "1:874279748136:web:29121591afb3a0f8c86b1d"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
const db = firebase.firestore();

console.log('Firebase initialized');
