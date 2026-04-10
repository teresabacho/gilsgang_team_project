import { Link, Navigate } from "react-router-dom";
import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import Header from "../components/Header";

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [redirect, setRedirect] = useState(false);
    const { setUser } = useContext(UserContext);
    const [error, setError] = useState(null);

    async function handleLoginSubmit(e) {
        e.preventDefault();
        try {
            const { data } = await axios.post('/api/auth/login', { email, password });
            setUser(data);
            setRedirect(true);
            setError(null);
        } catch (e) {
            setError(e.response.data.error || 'Login failed');
        }
    }

    if (redirect) {
        return <Navigate to={'/'} />;
    }

    return (
        <div>
            <Header />
            <div className="auth-container">
                <div className="auth-container-box">
                    <form onSubmit={handleLoginSubmit}>
                        <h2>Увійти</h2>

                        <input
                            type="email"
                            placeholder="електронна пошта"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="пароль"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button className="button">Увійти</button>
                        <div className="auth-info">
                            Ще не маєте профілю? <Link to={'/signup'}>Зареєструйтесь</Link>
                        </div>
                        {error && <div className="message-box error">{error}</div>}
                    </form>
                </div>
            </div>
        </div>
    );
}
