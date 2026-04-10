import '../styles/header.css';
import '../styles/index.css';
import {Link} from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from "axios";

export default function IndexPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const navigate = useNavigate();
    const [latestMovies, setLatestMovies] = useState([]);
    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    useEffect(() => {
        const fetchLatestMovies = async () => {
            try {
                const response = await axios.get('/api/movie/latest');
                setLatestMovies(response.data);
            } catch (error) {
                console.error('Error fetching latest movies:', error);
            }
        };

        fetchLatestMovies();
    }, []);
    const handleSearchSubmit = (event) => {
        event.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/searchresult?title=${searchQuery}`);
        }
    };
    return (
        <div className="index-page-container">
            <Header />
            <div className="hero-container">
                <div className="container-text">
                    <div className="text-wrap">
                        <h2>Вітаємо Вас на MovieMapUA!</h2>
                        <p>Приєднуйтеся до нас та вирушайте у захопливу подорож через найяскравіші моменти кінематографу!</p>
                        <button className="c-button">Детальніше</button>
                    </div>
                    <img src={require('../images/First.png')} alt="" className="image-1" />
                    <img src={require('../images/Second.png')} alt="" className="image-2" />
                </div>
                <div className="searchbar">
                    <p>Здійснюйте пошук ваших улюблених<br /> фільмів прямо зараз!</p>
                    <form onSubmit={handleSearchSubmit}>
                        <input type="text"
                               id="searchInput"
                               placeholder="Введіть Ваш пошуковий запит..."
                               className="searchInput"
                               value={searchQuery}
                               onChange={handleSearchChange}>
                        </input>
                    </form>
                </div>
                <div className="cards">
                    <p>Новинки кіно</p>
                    <div style={{ display: "flex", justifyContent: "space-around" }}>
                        {latestMovies.map(movie => (
                            <Link className="link" key={movie._id}  to={`/movie/${movie._id}`}>
                                <div className="card">
                                    <img src={movie.posterUrl} alt={movie.title} className="card-image" />
                                    <h1>{movie.title}</h1>
                                    <p>Режисер: {movie.director}<br />Рік випуску: {movie.year}<br />Жанр: {movie.genre}</p>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );

}