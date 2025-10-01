import { useState, useEffect } from 'react'
import { register, trackSignUp, trackPageView } from '../utils/firebase'
import { Link } from 'react-router-dom'

function Cadastro(){
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        trackPageView('Cadastro');
    }, []);

    async function handleRegister(e) {
        e.preventDefault();
        setLoading(true);
        setError("");

        if(password !== confirmPassword){
            setError("As senhas não coicidem!");
            setLoading(false);
            return;
        }
        if(password.length < 6){
            setError("A senha deve ter pelo menos 6 caracteres");
            setLoading(false);
            return;
        }

        try {
            await register(email, password)
            trackSignUp('email');
            window.location.href = "/";
        } catch (err) {
            if (err.code === 'auth/email-already-in-use') {
                setError("Este email já possui cadastro.");
            } else {
                setError("Erro ao criar a conta: " + err.message);
            }
        }
        setLoading(false);
    }



    return(
        <div className="main-container">
            <div className="screen-container">
                <div className="screen-header">
                    <h1 className="screen-title">Cadastro</h1>
                </div>
                <div className="form-container">
                    <form onSubmit={handleRegister}>
                        <div className="form-group">
                            <input
                                className="form-input"
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Senha"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <input
                                className="form-input"
                                type="password"
                                placeholder="Confirmar Senha"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        {error && (
                            <div style={{ color: "red", marginBottom: 15, textAlign: 'center' }}>
                                {error}
                            </div>
                        )}
                        <button
                            className="form-button"
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Criando conta..." : "Criar Conta"}
                        </button>
                    </form>
                </div>
                <div className="link-text">
                    Já tem conta? <Link className="link-button" to="/login">Faça login</Link>
                </div>
            </div>
        </div>
    )
}

export default Cadastro;