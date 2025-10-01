import { openDB } from "idb";
import { addTaskToFirebase, updateTaskInFirebase, getTasksFromFirebase } from './firebase';

const DB_NAME = 'calendarDB';
const STORE_NAME = 'calendar';

export async function initDB() {
    try {
        return openDB(DB_NAME, 1, {    
            upgrade(db) {
                if(!db.objectStoreNames.contains(STORE_NAME)) 
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
        });
    } catch (error) {
        console.error('Erro ao inicialiar database:', error);
        throw error;
    }
}

export async function addTask(task) {
    try {
        // Salvar tarefa localmente
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        await store.put(task);
        await tx.done;
        
        // Se online, sincronizar e atualizar status
        if (navigator.onLine) {
            try {
                await addTaskToFirebase(task);
                // Buscar tarefa do banco e atualizar
                const db2 = await initDB();
                const tx2 = db2.transaction(STORE_NAME, 'readwrite');
                const store2 = tx2.objectStore(STORE_NAME);
                const savedTask = await store2.get(task.id);
                if (savedTask) {
                    savedTask.synced = true;
                    await store2.put(savedTask);
                }
                await tx2.done;
            } catch (error) {
                console.warn('Falha ao sincronizar com Firebase:', error);
            }
        }
        
        return task.id;
    } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
        throw error;
    }
}

export async function getTasks(userId) {
    try {
        // Sempre buscar do IndexedDB local primeiro
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const localTasks = await store.getAll();
        await tx.done;
        
        // Se online, buscar do Firebase para sincronizar tarefas que podem ter vindo de outros dispositivos
        if (navigator.onLine && userId) {
            try {
                const firebaseTasks = await getTasksFromFirebase(userId);
                const db2 = await initDB();
                const tx2 = db2.transaction(STORE_NAME, 'readwrite');
                const store2 = tx2.objectStore(STORE_NAME);
                
                // Adicionar tarefas do Firebase que não existem localmente
                for (const fbTask of firebaseTasks) {
                    const existsLocal = localTasks.find(t => t.id === fbTask.id);
                    if (!existsLocal) {
                        const newTask = { ...fbTask, synced: true };
                        await store2.put(newTask);
                        localTasks.push(newTask);
                    }
                }
                await tx2.done;
            } catch (error) {
                console.warn('Falha ao buscar do Firebase:', error);
            }
        }
        
        const result = userId ? localTasks.filter(t => t.userId === userId) : localTasks;

        return result;
    } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        throw error;
    }
}

export async function updateTask(taskId, updates) {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const task = await store.get(taskId);
        if (task) {
            const updatedTask = { ...task, ...updates, lastUpdated: Date.now(), synced: false };
            await store.put(updatedTask);
            await tx.done;
            
            // Tentar sincronizar com Firebase
            if (navigator.onLine) {
                try {
                    await updateTaskInFirebase(taskId, updatedTask);
                    // Nova transação para marcar como sincronizado
                    const db2 = await initDB();
                    const tx2 = db2.transaction(STORE_NAME, 'readwrite');
                    const store2 = tx2.objectStore(STORE_NAME);
                    await store2.put({ ...updatedTask, synced: true });
                    await tx2.done;
                } catch (error) {
                    console.warn('Falha ao sincronizar atualização com Firebase:', error);
                }
            }
        } else {
            await tx.done;
        }
    } catch (error) {
        console.error('Erro ao atualizar tarefa:', error);
        throw error;
    }
}

export async function syncPendingTasks() {
    if (!navigator.onLine) return;
    
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const tasks = await store.getAll();
        await tx.done;
        
        const unsyncedTasks = tasks.filter(task => !task.synced);
        
        for (const task of unsyncedTasks) {
            try {
                await addTaskToFirebase(task);
                await updateTask(task.id, { synced: true });
            } catch (error) {
                console.warn('Falha ao sincronizar tarefa:', task.id, error);
            }
        }
    } catch (error) {
        console.error('Erro ao sincronizar tarefas pendentes:', error);
    }
}