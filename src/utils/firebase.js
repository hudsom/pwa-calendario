import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { getFirestore, collection, setDoc, doc, getDocs, query, where, updateDoc, deleteDoc } from "firebase/firestore";
import { getAnalytics, logEvent } from "firebase/analytics";

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
const analytics = getAnalytics(app);

export const auth = getAuth(app);

// Analytics functions
export function trackEvent(eventName, parameters = {}) {
    logEvent(analytics, eventName, parameters);
}

export function trackLogin(method = 'email') {
    logEvent(analytics, 'login', { method });
}

export function trackSignUp(method = 'email') {
    logEvent(analytics, 'sign_up', { method });
}

export function trackTaskCreated() {
    logEvent(analytics, 'task_created');
}

export function trackTaskCompleted() {
    logEvent(analytics, 'task_completed');
}

export async function trackUserLogin(userId, method = 'email') {
    logEvent(analytics, 'login', { method });
    const { trackUserLogin: trackLoginFirestore } = await import('./analytics');
    await trackLoginFirestore(userId);
}

export async function trackUserTaskCreated(userId) {
    logEvent(analytics, 'task_created');
    const { trackUserTaskCreated: trackTaskFirestore } = await import('./analytics');
    await trackTaskFirestore(userId);
}

export async function trackUserTaskCompleted(userId) {
    logEvent(analytics, 'task_completed');
    const { trackUserTaskCompleted: trackCompletedFirestore } = await import('./analytics');
    await trackCompletedFirestore(userId);
}

export function trackPageView(pageName) {
    logEvent(analytics, 'page_view', { page_title: pageName });
}

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

export async function updateTaskInFirebase(taskId, updates) {
    const ref = doc(db, TASKS_COLLECTION, taskId);
    await updateDoc(ref, updates);
}

export async function deleteTaskFromFirebase(taskId) {
    const ref = doc(db, TASKS_COLLECTION, taskId);
    await deleteDoc(ref);
}

export async function getTasksFromFirebase(userId){
    const ref = collection(db, TASKS_COLLECTION);
    const q = query(ref, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id}));
}