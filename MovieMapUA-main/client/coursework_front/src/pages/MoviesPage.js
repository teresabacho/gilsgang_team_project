
import axios from "axios";
import { useEffect, useState, useContext } from "react";
import MovieItem from "../components/MovieItem";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AddMovieForm from "../components/AddMovieForm";
import { UserContext } from "../context/UserContext";

export default function MoviesPage() {
    const [movies, setMovies] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(5);
    const [isLastPage, setIsLastPage] = useState(false);
    const [showAddMovieForm, setShowAddMovieForm] = useState(false);
    const [filters, setFilters] = useState({ year: '', genre: '' });
    const { user } = useContext(UserContext);

    useEffect(() => {
        getAllMovies();
        window.scrollTo({ top: 0, behavior: "smooth" });
    }, [page, filters]);

    useEffect(() => {
        setIsLastPage(false);
    }, [page]);

    async function getAllMovies() {
        try {
            const res = await axios.get(`/api/movie/page?page=${page}&limit=${limit}`, { params: filters });
            setMovies(res.data.movies || []);
            setIsLastPage(res.data.movies.length < limit);
        } catch (err) {
            console.error("Error fetching movies:", err);
            setMovies([]);
        }
    }

    const handleNextPage = () => {
        setPage((prevPage) => prevPage + 1);
    };

    const handlePreviousPage = () => {
        setPage((prevPage) => Math.max(prevPage - 1, 1));
    };

    const toggleAddMovieForm = () => {
        setShowAddMovieForm((prevShowAddMovieForm) => !prevShowAddMovieForm);
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters((prevFilters) => ({
            ...prevFilters,
            [name]: value,
        }));
        setPage(1);
    };

    const handleFilterReset = () => {
        setFilters({ year: '', genre: '' });
        setPage(1);
    };

    return (
        <div>
            <Header />
            <div style={{ display: "grid" }}>
                <div style={{ display: "grid", justifyContent: "center" }}>
                    <h1 className="page-header">Список Фільмів</h1>
                    {user && (
                        <button className="button" onClick={toggleAddMovieForm}>
                            Додати Фільм
                        </button>
                    )}
                    {showAddMovieForm && <AddMovieForm onClose={toggleAddMovieForm}  />}


                    <div>
                        <h2 className="page-header">Фільтрувати фільми</h2>
                        <form>

                            <input
                                style={{ margin: "5px" }}
                                type="text"
                                name="year"
                                placeholder="Рік"
                                value={filters.year}
                                onChange={handleFilterChange}
                            />
                            <input
                                style={{ margin: "5px" }}
                                type="text"
                                name="genre"
                                placeholder="Жанр"
                                value={filters.genre}
                                onChange={handleFilterChange}
                            />
                            <button type="button" className="button" onClick={handleFilterReset}>
                                Скинути фільтри
                            </button>
                        </form>
                    </div>

                </div>
                {movies.map((movie) => (
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
                <div style={{ display: "flex", justifyContent: "center", margin: "20px" }}>
                    <button className="button" onClick={handlePreviousPage} disabled={page === 1}>
                        Попередня сторінка
                    </button>
                    <span style={{
                        margin: "0 10px",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                    }}>Сторінка {page}</span>
                    <button className="button" onClick={handleNextPage} disabled={isLastPage}>
                        Наступна сторінка
                    </button>
                </div>
            </div>
            <Footer />
        </div>
    );
}
