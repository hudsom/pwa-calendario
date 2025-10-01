import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, setDoc, doc, getDoc } from "firebase/firestore";

const TASKS_COLLECTION = 'tasks'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export const auth = getAuth(app);

export function login(email, senha){
    return signInWithEmailAndPassword(auth, email, senha);

}

export function register(email, senha){
    return createUserWithEmailAndPassword(auth, email, senha);
}

export function logout(){
    return signOut(auth);
}

export async function addTaskToFirebase(task) {
    const ref = doc(db, TASKS_COLLECTION, task.id);
    await setDoc(ref, task);
}

export async function getTasksFromFirebase(){
    const ref = collection(db, TASKS_COLLECTION);
    const snapshot = await getDocs(ref);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id}));
}