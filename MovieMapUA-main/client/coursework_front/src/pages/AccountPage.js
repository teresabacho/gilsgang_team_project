
import React, { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axios from "axios";
import MovieItem from "../components/MovieItem";

export default function AccountPage() {
    const {user, setUser} = useContext(UserContext);
    const navigate = useNavigate();
    const [favoriteMovies, setFavoriteMovies] = useState([]);
    const [addedMovies, setAddedMovies] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [username, setUsername] = useState(user ? user.username : '');
    const [email, setEmail] = useState(user ? user.email : '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (user) {

            fetchAddedMovies();
        }
    }, [user]);


    const fetchAddedMovies = async () => {
        try {
            const res = await axios.get('/api/user/added', {withCredentials: true});
            setAddedMovies(res.data);
        } catch (error) {
            console.error("Error fetching added movies:", error);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await axios.post('/api/auth/logout');
            if (response.status === 200) {
                window.location.href = '/';
            } else {
                console.error('Failed to log out:', response.statusText);
            }
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const handleEditProfile = async () => {
        try {
            const response = await axios.post('/api/user/edit-profile', {
                username,
                email,
                currentPassword,
                newPassword,
            });
            if (response.status === 200) {
                setUser(response.data.user);
                setIsModalOpen(false);
                setMessage('Profile updated successfully.');
                setError(null);

                setCurrentPassword('');
                setNewPassword('');
            } else {
                setError(response.data.error || 'Error updating profile.');
                setMessage(null);
            }
        } catch (error) {
            setError(error.response.data.error || 'Internal Server Error');
            setMessage(null);
        }
    };

    useEffect(() => {
        if (user) {
            setUsername(user.username);
            setEmail(user.email);
        }
    }, [user]);

    const handleModalClose = () => {
        setIsModalOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setMessage(null);
        setError(null);
    };

    const handleModalOpen = () => {
        setIsModalOpen(true);
        if (user) {
            setUsername(user.username);
            setEmail(user.email);
        }
    };


    const handleGoToFavorites = () => {
        navigate('/favorites');
    };

    return (
        <div>
            <Header/>
            <h2 className="page-header">Мій профіль</h2>
            <div style={{display: "flex", justifyContent: "center"}}>
                <div className="info-container" style={{width: "60%", alignItems: "center"}}>
                    {user && (
                        <>
                            <p style={{fontSize: "25px"}}>Ім'я користувача: {user.username}</p>
                            <p style={{fontSize: "25px"}}>Електронна пошта: {user.email}</p>
                        </>
                    )}
                    <div className="profile-buttons"
                         style={{display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center"}}>
                        <button className="button" onClick={handleModalOpen}>Редагувати профіль</button>
                        <button className="button" onClick={handleGoToFavorites}>Обране</button>
                        <button className="button" onClick={handleLogout}>Вийти</button>
                    </div>
                </div>
            </div>
            {message && <div className="message-box success">{message}</div>}
            {isModalOpen && (
                <div className="modal">
                    <div className="modal-content" style={{padding: "20px", borderRadius: "8px", width: "300px"}}>

                        <h2>Редагувати профіль</h2>
                        <label>
                            Ім'я користувача:
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={{width: "100%", padding: "8px", margin: "8px 0"}}
                            />
                        </label>
                        <label>
                            Електронна пошта:
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{width: "100%", padding: "8px", margin: "8px 0"}}
                            />
                        </label>
                        <label>
                            Поточний пароль:
                            <input
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                style={{width: "100%", padding: "8px", margin: "8px 0"}}
                            />
                        </label>
                        <label>
                            Новий пароль:
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                style={{width: "100%", padding: "8px", margin: "8px 0"}}
                            />
                        </label>
                        <button className="button" onClick={handleEditProfile}
                                style={{padding: "10px 20px", margin: "10px 0"}}>Зберегти
                        </button>
                        <button className="button" onClick={handleModalClose}
                                style={{padding: "10px 20px", margin: "10px 0"}}>Закрити
                        </button>

                        {error && <div className="message-box error">{error}</div>}
                    </div>
                </div>
            )}

            <h2 className="page-header">Мої додані фільми</h2>
            <div className="added-container" style={{display: "grid"}}>
                {addedMovies.map(movie => (
                    <MovieItem
                        key={movie._id}
                        id={movie._id}
                        title={movie.title}
                        posterUrl={movie.posterUrl}
                        year={movie.year}
                        director={movie.director}
                        genre={movie.genre}
                    />
                ))}
            </div>
            <Footer/>
        </div>
    );
}