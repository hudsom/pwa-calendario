import { openDB } from "idb";

const DB_NAME = 'calendarDB';
const STORE_NAME = 'calendar';

export async function initDB() {
    try {
        return openDB(DB_NAME, 1, {    
            upgrade(db) {
                if(!db.objectStoreNames.contains(STORE_NAME)) 
                    db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
            }
        });
    } catch (error) {
        console.error('Erro ao inicialiar database:', error);
        throw error;
    }
}

export async function addTask(task) {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const id = await store.add(task);
        await tx.done;
        return id;
    } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
    }
}

export async function getTasks() {
    try {
        const db = await initDB();
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const tasks = await store.getAll();
        await tx.done;
        return tasks;
    } catch (error) {
        console.error('Erro ao buscar tarefas:', error);
        throw error;
    }
}