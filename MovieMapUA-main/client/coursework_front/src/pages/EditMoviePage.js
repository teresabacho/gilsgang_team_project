
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function EditMoviePage() {
    const [movie, setMovie] = useState({
        title: '',
        description: '',
        year: '',
        director: '',
        genre: '',
        posterUrl: '',
        locations: []
    });
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMovie = async () => {
            const res = await axios.get(`/api/movie/${id}`);
            setMovie(res.data.movie);
        };
        fetchMovie();
    }, [id]);

    useEffect(() => {
        const fetchLocations = async () => {
            const res = await axios.get(`/api/location/movie/${id}`);
            setMovie((prevMovie) => ({
                ...prevMovie,
                locations: res.data.locations
            }));
        };
        fetchLocations();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setMovie((prevMovie) => ({
            ...prevMovie,
            [name]: value
        }));
    };

    const handleLocationChange = (index, field, value) => {
        const newLocations = [...movie.locations];
        newLocations[index][field] = value;
        setMovie((prevMovie) => ({
            ...prevMovie,
            locations: newLocations
        }));
    };

    const handleDeleteLocation = async (index) => {
        const location = movie.locations[index];
        if (location._id) {
            try {
                await axios.delete(`/api/location/${location._id}`);
            } catch (error) {
                console.error("Error deleting location:", error);
                alert("An error occurred while deleting the location. Please try again.");
                return;
            }
        }
        const newLocations = movie.locations.filter((_, i) => i !== index);
        setMovie((prevMovie) => ({
            ...prevMovie,
            locations: newLocations
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const requiredFields = ['title', 'description', 'year', 'director', 'genre', 'posterUrl'];
        for (let field of requiredFields) {
            if (!movie[field]) {
                alert(`The field "${field}" is required.`);
                return;
            }
        }


        for (let i = 0; i < movie.locations.length; i++) {
            const location = movie.locations[i];
            if (!location.title ||  !location.coordinates) {
                alert("All location fields are required.");
                return;
            }

            if (typeof location.coordinates === 'string') {
                location.coordinates = location.coordinates.split(',').map(coord => parseFloat(coord.trim()));
            }
        }

        try {

            const locationIds = await Promise.all(movie.locations.map(async (location) => {
                if (location._id) {

                    const response = await axios.put(`/api/location/${location._id}`, location);
                    return response.data.location._id;
                } else {

                    const response = await axios.post('/api/location', { ...location, movie: id });
                    return response.data.location._id;
                }
            }));


            const updatedMovie = {
                ...movie,
                locations: locationIds
            };


            console.log("Sending movie data:", updatedMovie);


            const response = await axios.put(`/api/movie/${id}`, updatedMovie);
            console.log("Update successful:", response.data);
            navigate(`/movie/${id}`);
        } catch (error) {
            if (error.response) {
                console.error("Server responded with an error:", error.response.data);
                alert(`Error: ${error.response.data.message || "An error occurred while updating the movie."}`);
            } else if (error.request) {
                console.error("No response received:", error.request);
                alert("No response received from the server. Please try again.");
            } else {
                console.error("Error setting up the request:", error.message);
                alert(`Error: ${error.message}`);
            }
        }
    };

    return (
        <div>
            <Header />
            <h1 className="page-header">Редагувати фільм</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div >
                    <form onSubmit={handleSubmit}>
                        <div className="edit-container">
                            <label className="title">
                                Назва:
                            </label>
                            <input type="text" name="title" value={movie.title} onChange={handleChange} />

                            <label className="title">
                                Опис:
                            </label>
                            <textarea name="description" value={movie.description} onChange={handleChange} />

                            <label className="title">
                                Рік:
                            </label>
                            <input type="text" name="year" value={movie.year} onChange={handleChange} />

                            <label className="title">
                                Режисер:
                            </label>
                            <input type="text" name="director" value={movie.director} onChange={handleChange}/>

                            <label className="title">
                                Жанр:
                            </label>
                            <input type="text" name="genre" value={movie.genre} onChange={handleChange} />

                            <label className="title">
                                URL постера:
                            </label>
                            <input type="text" name="posterUrl" value={movie.posterUrl} onChange={handleChange}/>

                            <button className="button" type="button" onClick={() => setMovie((prevMovie) => ({
                                ...prevMovie,
                                locations: [...prevMovie.locations, { title: "",  coordinates: "" }]
                            }))}>
                                Додати локацію
                            </button>
                            <button className="button" type="submit">Зберегти зміни</button>
                        </div>
                    </form>
                </div>

                <div >
                    {movie.locations.map((location, index) => (
                        <div key={index} className="edit-container">
                            <label className="title">
                                Назва локації:
                            </label>
                            <input
                                type="text"
                                value={location.title}
                                onChange={(e) => handleLocationChange(index, "title", e.target.value)}
                            />



                            <label className="title">
                                Координати:
                            </label>
                            <input
                                type="text"
                                value={location.coordinates}
                                onChange={(e) => handleLocationChange(index, "coordinates", e.target.value)}
                            />
                            <button className="button" type="button" onClick={() => handleDeleteLocation(index)}>Видалити локацію</button>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </div>
    );
}
