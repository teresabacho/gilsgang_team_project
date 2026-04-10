import {Link, Navigate} from "react-router-dom";
import {useState} from "react";
import axios from "axios";
import Header from "../components/Header";
export default function SignupPage() {
    const [username, setUsername] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [redirect, setRedirect] = useState(false);
    async function signupUser(e) {
        e.preventDefault();
        try {
            await axios.post('/api/auth/register', {
                username,
                email,
                password,
            });
            alert('Sign up successful. Now you can log in.')
            setRedirect(true);
        } catch (e) {
            alert('Signup failed. Please try again later.')
        }
    }
    if (redirect){
        return <Navigate to={'/login'}/>
    }
    return(
        <div>
            <Header/>

            <div className="auth-container">
                <div className="auth-container-box">
                    <form onSubmit={signupUser}>
                        <h2>Створити профіль:</h2>
                        <input
                            type="username"
                            placeholder="ім'я користувача"
                            value = {username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                        <input
                            type="email"
                            placeholder="електронна пошта"
                            value = {email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            placeholder="пароль"
                            value = {password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />

                        <button className="button">Зареєструватись</button>
                        <div className="auth-info">
                            Вже маєте профіль? <Link  to={'/login'}>Увійти</Link> </div>
                    </form>


                </div>
            </div>
        </div>

    );
}