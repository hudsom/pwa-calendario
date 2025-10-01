import { useEffect, useState } from "react";
import { getTasks } from "../utils/db";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { shareTask } from "../utils/native"
import OfflineIndicator from "../componentes/OfflineIndicator";
import { trackPageView } from "../utils/firebase";
import AnalyticsReports from "../componentes/AnalyticsReports";


async function handleShare(task) {
    try {
        await shareTask(task);
    } catch (err) {
        alert(err.message || 'Não foi possível compartilhar.');
    }
}

function Dashboard() {
    const {currentUser, logout } = useAuth();
    const [completedTasks, setCompletedTasks] = useState([]);

    async function handleLogout() {
        try {
            await logout();
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = '/login';
        } catch (error) {
            console.error("Erro ao fazer logout: " + error);
        }
    }
    
    useEffect(() => {
        trackPageView('Dashboard');
        if (!currentUser) {
            window.location.href = '/login';
            return;
        }
        async function fetchTasks() {
            const allTasks = await getTasks();
            const userTasks = allTasks.filter(task => task.userId === currentUser.uid);
            const filtered = userTasks.filter(t => t.done);
            setCompletedTasks(filtered);
        }
        fetchTasks();
    }, [currentUser])

    return(
        <div className="main-container">
            <OfflineIndicator />
            <div className="screen-container">
            <div style={{ display: 'flex', gap: '8px', marginBottom: 16 }}>
                <Link to="/home" style={{ flex: 1 }}>
                    <button style={{ background: '#1976d2', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', textDecoration: 'none', width: '100%' }}>Voltar para Home</button>
                </Link>
                <button onClick={handleLogout} style={{ background: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold' }}>Logout</button>
            </div>
            <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <span style={{ marginRight: 15 }}>Usuário logado: {currentUser?.email}</span>
            </div>
            <h1 className="screen-title" style={{ textAlign: 'center', marginBottom: 24 }}>Dashboard</h1>
            <AnalyticsReports completedTasks={completedTasks} onShareTask={handleShare} />

            </div>
        </div>
    )
}
export default Dashboard;