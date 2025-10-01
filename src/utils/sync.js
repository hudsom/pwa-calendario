import { getTasks, addTask } from "./db";
import { addTaskToFirebase} from "./firebase";

export async function syncTasks() {
    const tasks = await getTasks();
    const unsyncedTasks = tasks.filter(task => !task.synced);
    let syncedCount = 0;

    for (const task of unsyncedTasks) {
        try {
            await addTaskToFirebase(task);
            task.synced = true;
            await addTask(task);
            console.log(`Tarefa ${task.id} sincronizada com sucesso.`);
            syncedCount++;
        } catch (error) {
            console.error(`Erro ao sincronizar tarefa ${task.id}:`, error);
        }
    }

    if (syncedCount > 0 && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
            new Notification('Sincronização de tarefas', {
                body: `${syncedCount} tarefas sincronizadas com sucesso.`,
                icon: '/vite.svg'
            });
        }
        console.log(`${syncedCount} tarefas sincronizadas com sucesso.`);
    } else {
        console.log("Nenhuma tarefa para sincronizar.");
    }
}