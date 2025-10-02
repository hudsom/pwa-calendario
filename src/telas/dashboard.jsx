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
            <nav style={{ padding: '12px', background: 'rgba(50, 60, 80, 0.95)' }}>
                <Link to="/home" className="nav-link" style={{ padding: '10px 16px', fontSize: '13px', background: 'rgba(102, 126, 234, 0.8)', color: 'white' }}>
                    Voltar para Home
                </Link>
                <button onClick={handleLogout} className="logout" style={{ padding: '10px 16px', fontSize: '13px' }}>
                    Logout
                </button>
            </nav>
            <div className="screen-header">
                <h1 className="screen-title">Dashboard</h1>
                <div className="screen-subtitle">Usuário logado: {currentUser?.email}</div>
            </div>
            <AnalyticsReports completedTasks={completedTasks} onShareTask={handleShare} />

            </div>
        </div>
    )
}
export default Dashboard;