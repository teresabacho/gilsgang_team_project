import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import MovieItem from '../components/MovieItem';
import Header from "../components/Header";
import Footer from "../components/Footer";

const useQuery = () => {
    return new URLSearchParams(useLocation().search);
};

const SearchResultPage = () => {
    const query = useQuery();
    const title = query.get('title');
    const [movies, setMovies] = useState([]);

    useEffect(() => {
        const fetchMovies = async () => {
            try {
                const response = await axios.get(`/api/movie/search?title=${title}`);
                setMovies(response.data.movies);
            } catch (error) {
                console.error('Error fetching movies:', error);
            }
        };

        if (title) {
            fetchMovies();
        }
    }, [title]);

    return (
        <div className="search-result">
            <Header />
            <div className="search-info" style={{ display: "grid", marginBottom: "20px" }}>
                {title && (
                    <h2 className = "page-header">Результати пошуку: {title}</h2>
                )}
                {title && movies.length === 0 && (
                    <h2 className = "page-header">Не знайдено :(</h2>
                )}

            {movies.map(movie => (
                <MovieItem
                    key={movie._id}
                    id={movie._id}
                    title={movie.title}
                    year={movie.year}
                    posterUrl={movie.posterUrl}
                    director={movie.director}
                    genre={movie.genre}
                />
            ))}

        </div>
            <Footer />
        </div>
    );
};

export default SearchResultPage;
