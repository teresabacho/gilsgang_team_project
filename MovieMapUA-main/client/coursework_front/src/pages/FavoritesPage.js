import React, { useContext, useEffect, useState, useCallback } from "react";
import { UserContext } from "../context/UserContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SuggestionCard from "../components/SuggestionCard";
import FavoriteGroups from "../components/FavoriteGroups";
import { useNavigate } from 'react-router-dom';
import axios from "axios";
import '../styles/favorites.css';
import deleteIcon from '../images/delete.png';

export default function FavoritesPage() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    const [favoritesByType, setFavoritesByType] = useState({
        movies: [],
        hotels: [],
        routes: [],
        attractions: []
    });
    const [groups, setGroups] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [localFavorites, setLocalFavorites] = useState({});

    const fetchAllFavorites = useCallback(async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/user/favorites', { withCredentials: true });
            setFavoritesByType(response.data);
        } catch (error) {
            console.error("Error fetching favorites:", error);
            setError("Помилка завантаження обраних елементів");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchGroups = useCallback(async () => {
        try {
            const response = await axios.get('/api/user/favorite-groups', { withCredentials: true });
            setGroups(response.data);
        } catch (error) {
            console.error("Error fetching groups:", error);
        }
    }, []);

    const handleGroupsUpdate = useCallback(() => {
        fetchGroups();
        fetchAllFavorites();
    }, [fetchGroups, fetchAllFavorites]);


    useEffect(() => {
        if (user) {
            fetchAllFavorites();
            fetchGroups();
        }
    }, [user, fetchAllFavorites, fetchGroups]);

    useEffect(() => {
        if (favoritesByType.hotels.length > 0 || favoritesByType.attractions.length > 0) {
            const favoriteStatus = {};

            favoritesByType.hotels.forEach(hotel => {
                if (hotel.data?.location_id || hotel.externalId) {
                    favoriteStatus[hotel.data?.location_id || hotel.externalId] = true;
                }
            });

            favoritesByType.attractions.forEach(attraction => {
                if (attraction.data?.location_id || attraction.externalId) {
                    favoriteStatus[attraction.data?.location_id || attraction.externalId] = true;
                }
            });

            setLocalFavorites(favoriteStatus);
        }
    }, [favoritesByType.hotels, favoritesByType.attractions]);


    const handleItemSelect = useCallback((itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    }, []);

    const handleRemoveFromFavorites = useCallback(async (favoriteId) => {
        if (!window.confirm("Ви впевнені, що хочете видалити цей елемент з обраних?")) {
            return;
        }

        try {
            const response = await axios.delete(`/api/user/favorites/${favoriteId}`, { withCredentials: true });
            if (response.status === 200) {
                setMessage("Елемент видалено з обраних");
                fetchAllFavorites();
                fetchGroups();
                setError(null);
            }
        } catch (error) {
            console.error("Error removing favorite:", error);
            setError("Помилка видалення елемента");
        }
    }, [fetchAllFavorites, fetchGroups]);

    const handleMessage = useCallback((msg) => {
        setMessage(msg);
        setTimeout(() => setMessage(null), 3000);
    }, []);

    const handleError = useCallback((err) => {
        setError(err);
        if (err) {
            setTimeout(() => setError(null), 5000);
        }
    }, []);

    const renderFavoriteItem = useCallback((item, showRemoveButton = true) => {
        const favoriteId = item.favoriteId || item._id;
        const isSelected = selectedItems.includes(favoriteId);

        return (
            <div key={favoriteId} className={`favorite-item ${isSelected ? 'selected' : ''}`}>
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleItemSelect(favoriteId)}
                    className="item-checkbox"
                />

                {showRemoveButton && (item.type === 'movie' || item.type === 'route') && (
                    <button
                        className="remove-favorite-btn"
                        onClick={() => handleRemoveFromFavorites(favoriteId)}
                        title="Видалити з обраних"
                    >
                        <img src={deleteIcon} alt="Видалити" />
                    </button>
                )}

                {item.type === 'movie' && (
                    <MovieItem item={item} />
                )}

                {item.type === 'route' && (
                    <RouteItem item={item} navigate={navigate} />
                )}

                {(item.type === 'hotel' || item.type === 'attraction') && (
                    <SuggestionCard
                        item={{
                            location_id: item.data?.location_id || item.externalId,
                            name: item.name,
                            photo: item.data?.photo,
                            rating_image_url: item.data?.rating_image_url,
                            address_obj: item.data?.address_obj,
                            rating: item.data?.rating,
                            num_reviews: item.data?.num_reviews,
                            web_url: item.data?.web_url,
                            latitude: item.location?.lat,
                            longitude: item.location?.lng
                        }}
                        type={item.type}
                        localFavorites={localFavorites}
                        setLocalFavorites={setLocalFavorites}
                        onRemoveFromFavorites={handleRemoveFromFavorites}
                        favoriteId={favoriteId}
                        className="favorite-item-card"
                    />
                )}
            </div>
        );
    }, [selectedItems, handleItemSelect, handleRemoveFromFavorites, localFavorites, navigate]);

    const MovieItem = ({ item }) => (
        <div
            className="movie-item-simple"
            onClick={() => window.location.href = `/movie/${item.movieId || item._id}`}
            style={{ cursor: 'pointer' }}
        >
            <img
                src={item.posterUrl}
                alt={item.title}
                className="movie-poster"
                onError={(e) => {
                    e.target.src = '/placeholder-poster.jpg';
                }}
            />
            <div className="movie-title">{item.title}</div>
        </div>
    );

    const RouteItem = ({ item, navigate }) => (
        <div className="route-item">
            <div className="route-header-item">
                <h4>{item.name}</h4>
            </div>
            <button
                className="button"
                onClick={() => navigate(`/route/${item._id}`)}
            >
                Деталі
            </button>
        </div>
    );

    const renderFavoritesSection = useCallback((items, title, type) => {
        if (items.length === 0) return null;

        return (
            <div className="favorites-section">
                <div className="routing-header">
                    <h3>{title} ({items.length})</h3>
                </div>
                <div className="favorites-grid">
                    {items.map(item => renderFavoriteItem(item))}
                </div>
            </div>
        );
    }, [renderFavoriteItem]);

    const totalFavorites = Object.values(favoritesByType).reduce((total, items) => total + items.length, 0);

    if (loading) {
        return (
            <div>
                <Header />
                <div className="loading">Завантаження...</div>
                <Footer />
            </div>
        );
    }

    return (
        <div>
            <Header />
            <h2 className="page-header">Моє обране</h2>

            {message && <div className="message-box success">{message}</div>}
            {error && <div className="message-box error">{error}</div>}

            {totalFavorites > 0 && (
                <FavoriteGroups
                    groups={groups}
                    onGroupsUpdate={handleGroupsUpdate}
                    favoritesByType={favoritesByType}
                    selectedItems={selectedItems}
                    setSelectedItems={setSelectedItems}
                    onMessage={handleMessage}
                    onError={handleError}
                />
            )}

            {renderFavoritesSection(favoritesByType.movies, "Обрані фільми", "movies")}
            {renderFavoritesSection(favoritesByType.routes, "Обрані маршрути", "routes")}
            {renderFavoritesSection(favoritesByType.hotels, "Обрані готелі", "hotels")}
            {renderFavoritesSection(favoritesByType.attractions, "Обрані екскурсії", "attractions")}

            {totalFavorites === 0 && (
                <div className="empty-favorites">
                    <h3>У вас поки немає обраних елементів</h3>
                    <p>Почніть додавати фільми, готелі, маршрути та атракції до обраних!</p>
                </div>
            )}

            <Footer />
        </div>
    );
}