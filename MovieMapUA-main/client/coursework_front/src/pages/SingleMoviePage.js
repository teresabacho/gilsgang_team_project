import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { UserContext } from "../context/UserContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import { Icon } from "leaflet";
import "leaflet/dist/leaflet.css";
import CommentForm from "../components/CommentForm";
import CommentList from "../components/CommentList";
import MarkerClusterGroup from "react-leaflet-cluster";

export default function SingleMoviePage() {
    const [movie, setMovie] = useState(null);
    const [locations, setLocations] = useState([]);
    const { user } = useContext(UserContext);
    const [isFavorite, setIsFavorite] = useState(false);
    const [comments, setComments] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        getMovieDetails(id)
            .then((res) => setMovie(res.movie))
            .catch((err) => console.log(err));
        getMovieLocations(id)
            .then((res) => setLocations(res.locations))
            .catch((err) => console.log(err));
    }, [id]);

    useEffect(() => {
        if (user && user.favorites) {

            const found = user.favorites.some(
                (fav) => fav.type === "movie" && fav.movieId?.toString() === id
            );
            setIsFavorite(found);
        }
    }, [user, id]);

    const customIcon = new Icon({
        iconUrl: require("../images/cinema.png"),
        iconSize: [38, 38]
    });

    const getMovieDetails = async (id) => {
        const res = await axios.get(`/api/movie/${id}`).catch((err) => console.log(err));
        if (res.status !== 200) {
            return console.log("Unexpected Error");
        }
        return res.data;
    };

    const getMovieLocations = async (id) => {
        const res = await axios.get(`/api/location/movie/${id}`).catch((err) => console.log(err));
        if (res.status !== 200) {
            return console.log("Unexpected Error");
        }
        return res.data;
    };

    const handleAddToFavorites = async () => {
        try {
            const res = await axios.post("/api/favorites/add", {
                type: "movie",
                movieId: id
            });
            if (res.status === 200) {
                setIsFavorite(true);
                console.log(`Фільм "${movie.title}" додано в обране.`);
            }
        } catch (error) {
            console.error("Помилка при додаванні фільму в обране:", error);
        }
    };

    const handleRemoveFromFavorites = async () => {
        try {

            const res = await axios.delete("/api/favorites/remove", {
                data: {
                    type: "movie",
                    movieId: id
                }
            });
            if (res.status === 200) {
                setIsFavorite(false);
                console.log(`Фільм "${movie.title}" видалено з обраного.`);
            }
        } catch (error) {
            console.error("Error removing from favorites:", error);
        }
    };

    const handleEdit = () => {
        navigate(`/edit-movie/${id}`);
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`/api/movie/${id}`);
            navigate('/');
        } catch (error) {
            console.error("Error deleting movie:", error);
        }
    };

    const handleNewComment = (newComment) => {
        setComments((prevComments) => [newComment, ...prevComments]);
    };

    const handleGoToRoute = () => {
        navigate("/routes", {
            state: {
                movieId: id,
                movieTitle: movie.title,
                locations: locations
            }
        });
    };

    return (
        <div>
            <Header />
            {movie && (
                <div className="wrapper" style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column"
                }}>
                    <div className="single-container">
                        <img src={movie.posterUrl} alt={movie.title} className="single-image" />
                        <div className="info">
                            <div className="title-info">
                                <h1 className="title">{movie.title}</h1>
                                {user && (
                                    isFavorite ? (
                                        <button className="favourite-button" onClick={handleRemoveFromFavorites}>Видалити з обраного</button>
                                    ) : (
                                        <button className="favourite-button" onClick={handleAddToFavorites}>Додати в обране</button>
                                    )
                                )}
                                {user && user._id === movie.user && (
                                    <div className="edit-delete-buttons" style={{display: "grid"}}>
                                        <button className="favourite-button" onClick={handleEdit}>Редагувати</button>
                                        <button className="favourite-button" onClick={handleDelete}>Видалити</button>
                                    </div>
                                )}
                                <button className="favourite-button" onClick={handleGoToRoute}>
                                    Побудувати маршрут
                                </button>

                            </div>
                            <div className="infoItem">
                                <p className="label">Режисер:</p>
                                <p className="value">{movie.director}</p>
                            </div>
                            <div className="infoItem">
                                <p className="label">Рік випуску:</p>
                                <p className="value">{movie.year}</p>
                            </div>
                            <div className="infoItem">
                                <p className="label">Жанр:</p>
                                <p className="value">{movie.genre}</p>
                            </div>
                            <div className="infoItem">
                                <p className="label">Опис фільму:</p>
                                <p className="value">{movie.description}</p>
                            </div>
                        </div>
                    </div>
                    <div className="movie-item" >
                        <MapContainer center={[49.0275, 31.482778]} zoom={3}>
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <MarkerClusterGroup chunkedLoading>
                                {locations.map(location => (
                                    <Marker
                                        key={location._id}
                                        position={[location.coordinates[0], location.coordinates[1]]}
                                        icon={customIcon}
                                    >
                                        <Popup>
                                            {location.title}
                                        </Popup>
                                    </Marker>

                                ))}
                            </MarkerClusterGroup>
                        </MapContainer>
                    </div>
                    <div className="single-container" style={{display: "grid"}}>
                        <CommentForm movieId={id} onNewComment={handleNewComment} />
                        <CommentList movieId={id} comments={comments} setComments={setComments} />
                    </div>
                </div>
            )}
            <Footer />
        </div>
    );
}
