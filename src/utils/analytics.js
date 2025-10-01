import { getFirestore, doc, setDoc, getDoc, updateDoc, increment, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { auth } from './firebase';

const db = getFirestore();

// Usar coleção tasks existente para analytics
const TASKS_COLLECTION = 'tasks';
const ANALYTICS_COLLECTION = 'user_analytics';

export async function getUserAnalytics(userId) {
    try {
        // Buscar dados das tarefas existentes
        const tasksRef = collection(db, TASKS_COLLECTION);
        const q = query(tasksRef, where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const tasks = snapshot.docs.map(doc => doc.data());
        
        // Calcular analytics baseado nas tarefas
        const totalTasks = tasks.length;
        const totalCompletedTasks = tasks.filter(t => t.done).length;
        
        // Buscar dados de login do Firestore
        try {
            const docRef = doc(db, ANALYTICS_COLLECTION, userId);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const loginData = docSnap.data();
                return {
                    ...loginData,
                    totalTasks: loginData.totalTasks || totalTasks,
                    totalCompletedTasks: loginData.totalCompletedTasks || totalCompletedTasks
                };
            } else {
                // Criar documento inicial se não existir
                const initialData = {
                    totalLogins: 1,
                    weeklyLogins: 1,
                    lastLogin: serverTimestamp(),
                    createdAt: serverTimestamp(),
                    totalTasks,
                    totalCompletedTasks,
                    weekStartDate: getWeekStart()
                };
                
                try {
                    await setDoc(docRef, initialData);
                    return {
                        ...initialData,
                        lastLogin: new Date(),
                        createdAt: new Date()
                    };
                } catch (createError) {
                    console.error('Erro ao criar documento analytics:', createError);
                    return {
                        totalLogins: 1,
                        weeklyLogins: 1,
                        lastLogin: new Date(),
                        createdAt: new Date(),
                        totalTasks,
                        totalCompletedTasks
                    };
                }
            }
        } catch (err) {
            console.warn('Erro ao acessar analytics:', err);
            return {
                totalLogins: 0,
                weeklyLogins: 0,
                lastLogin: null,
                createdAt: null,
                totalTasks,
                totalCompletedTasks
            };
        }
    } catch (error) {
        console.error('Erro geral ao buscar analytics:', error);
        return {
            totalLogins: 0,
            totalTasks: 0,
            totalCompletedTasks: 0,
            lastLogin: null,
            weeklyLogins: 0,
            createdAt: null
        };
    }
}

export async function trackUserLogin(userId) {
    try {
        const docRef = doc(db, ANALYTICS_COLLECTION, userId);
        const docSnap = await getDoc(docRef);
        
        const currentWeekStart = getWeekStart();
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            const updates = {
                totalLogins: increment(1),
                lastLogin: serverTimestamp()
            };
            
            // Se é uma nova semana, resetar contador semanal
            if (data.weekStartDate?.toDate?.()?.getTime() !== currentWeekStart.getTime()) {
                updates.weeklyLogins = 1;
                updates.weekStartDate = currentWeekStart;
            } else {
                updates.weeklyLogins = increment(1);
            }
            
            await updateDoc(docRef, updates);
        } else {
            await setDoc(docRef, {
                totalLogins: 1,
                totalTasks: 0,
                totalCompletedTasks: 0,
                lastLogin: serverTimestamp(),
                weeklyLogins: 1,
                weekStartDate: currentWeekStart,
                createdAt: serverTimestamp()
            });
        }
    } catch (error) {
        console.warn('Não foi possível salvar dados de login:', error);
    }
}

export async function trackUserTaskCreated(userId) {
    try {
        const docRef = doc(db, ANALYTICS_COLLECTION, userId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            await setDoc(docRef, {
                totalLogins: 0,
                totalTasks: 1,
                totalCompletedTasks: 0,
                lastLogin: null,
                weeklyLogins: 0,
                weekStartDate: getWeekStart(),
                createdAt: serverTimestamp()
            });
        } else {
            await updateDoc(docRef, {
                totalTasks: increment(1)
            });
        }
    } catch (error) {
        console.warn('Não foi possível atualizar contador de tarefas:', error);
    }
}

export async function trackUserTaskCompleted(userId) {
    try {
        const docRef = doc(db, ANALYTICS_COLLECTION, userId);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            await setDoc(docRef, {
                totalLogins: 0,
                totalTasks: 0,
                totalCompletedTasks: 1,
                lastLogin: null,
                weeklyLogins: 0,
                weekStartDate: getWeekStart(),
                createdAt: serverTimestamp()
            });
        } else {
            await updateDoc(docRef, {
                totalCompletedTasks: increment(1)
            });
        }
    } catch (error) {
        console.warn('Não foi possível atualizar contador de tarefas completadas:', error);
    }
}

function getWeekStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek;
    return new Date(now.setDate(diff));
}