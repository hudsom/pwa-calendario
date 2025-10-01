import { useState, useEffect } from 'react'
import { login } from '../utils/firebase'
import { Link } from "react-router-dom"
import OfflineIndicator from "../componentes/OfflineIndicator"
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { useAuth } from '../context/AuthContext'

function Login(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [emailError, setEmailError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const { isOnline } = useOnlineStatus();
    const { currentUser } = useAuth();

    useEffect(() => {
        if (currentUser) {
            window.location.href = '/';
        }
    }, [currentUser]);

    async function handleLogin(e) {
        e.preventDefault();
        setLoading(true);
        setError("");
        setEmailError("");
        setPasswordError("");

        try {
            await login(email, password);
            window.location.href = '/';

        } catch (err) {
            if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-email') {
                setEmailError("Usuário inválido");
                const emailInput = document.querySelector('input[type="email"]');
                if (emailInput) {
                    emailInput.setCustomValidity("Usuário inválido");
                    emailInput.reportValidity();
                }
            } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setPasswordError("Senha inválida");
                const passwordInput = document.querySelector('input[type="password"]');
                if (passwordInput) {
                    passwordInput.setCustomValidity("Senha inválida");
                    passwordInput.reportValidity();
                }
            } else {
                setError("Erro ao fazer login " + err.message);
            }
        }
        setLoading(false);
    }

    function handleEmailChange(e) {
        setEmail(e.target.value);
        setEmailError("");
        e.target.setCustomValidity("");
    }

    function handlePasswordChange(e) {
        setPassword(e.target.value);
        setPasswordError("");
        e.target.setCustomValidity("");
    }

    return (
        <div className="main-container">
            <OfflineIndicator />
            <div className="screen-container">
                <div className="screen-header">
                    <h1 className="screen-title">Login</h1>
                </div>
                <div className="form-container">
                    <form onSubmit={handleLogin}>
                        <div className="form-group">
                            <input
                                className="form-input"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={handleEmailChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Senha"
                                value={password}
                                onChange={handlePasswordChange}
                                required
                            />
                        </div>
                        {error && (
                            <div style={{ color: 'red', marginBottom: 15, textAlign: 'center' }}>
                                {error}
                            </div>
                        )}
                        <button
                            className="form-button"
                            type="submit"
                            disabled={loading || !isOnline}
                            style={{ 
                                opacity: !isOnline ? 0.5 : 1,
                                cursor: !isOnline ? 'not-allowed' : 'pointer'
                            }}
                            title={!isOnline ? "Login não disponível offline" : ""}
                        >
                            {loading ? "Entrando..." : !isOnline ? "Offline - Login Indisponível" : "Entrar"}
                        </button>
                    </form>
                </div>

                <div className="link-text">
                    Não tem conta? {isOnline ? (
                        <Link className="link-button" to="/cadastro">Cadastre-se</Link>
                    ) : (
                        <span style={{ 
                            color: '#999', 
                            cursor: 'not-allowed',
                            textDecoration: 'line-through' 
                        }} title="Cadastro não disponível offline">
                            Cadastre-se
                        </span>
                    )}
                </div>
            </div>
        </div>
    )

}

export default Login;