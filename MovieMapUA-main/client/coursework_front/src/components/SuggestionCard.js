import React, { useContext } from "react";
import heartFilled from '../images/heart-filled.png';
import heartEmpty from '../images/heart-empty.png';
import { UserContext } from "../context/UserContext";
import axios from "axios";
import '../styles/movieitem.css';

const SuggestionCard = ({
                            item,
                            type,
                            localFavorites,
                            setLocalFavorites,
                            showRemoveButton = false,
                            onRemove = null,
                            onRemoveFromFavorites = null,
                            favoriteId = null,
                            className = "suggestion-card"
                        }) => {
    const { user } = useContext(UserContext);
    const isFavorite = localFavorites[item.location_id] || false;

    const handleAddToFavorites = async () => {
        try {
            const res = await axios.post("/api/favorites/add", {
                type,
                externalId: item.location_id,
                name: item.name,
                location: item.latitude && item.longitude
                    ? { lat: item.latitude, lng: item.longitude }
                    : null,
                data: item
            });

            if (res.status === 200) {
                setLocalFavorites(prev => ({
                    ...prev,
                    [item.location_id]: true
                }));
            }
        } catch (error) {
            console.error("Помилка при додаванні в обране:", error);
        }
    };

    const handleRemoveFromFavorites = async () => {
        try {

            if (onRemoveFromFavorites && favoriteId) {
                await onRemoveFromFavorites(favoriteId);
                return;
            }


            const res = await axios.delete("/api/favorites/remove", {
                data: { type, externalId: item.location_id }
            });

            if (res.status === 200) {
                setLocalFavorites(prev => ({
                    ...prev,
                    [item.location_id]: false
                }));


                if (onRemove) {
                    onRemove(item.location_id);
                }
            }
        } catch (error) {
            console.error("Помилка при видаленні з обраного:", error);
        }
    };

    const toggleFavorite = e => {
        e.stopPropagation();


        if (onRemoveFromFavorites && favoriteId) {
            handleRemoveFromFavorites();
        } else {

            isFavorite ? handleRemoveFromFavorites() : handleAddToFavorites();
        }
    };

    return (
        <div className={className}>
            {(item.photo?.images?.large?.url) && (
                <div className="suggestion-photo">
                    <img
                        src={item.photo?.images?.large?.url}
                        alt={item.name}
                        onError={(e) => {
                            console.error("❌ Image load error for:", item.name, e.target.src);
                            e.target.style.display = 'none';
                        }}
                    />
                </div>
            )}

            <div className="suggestion-content">
                <div className="suggestion-header">
                    <strong>{item.name}</strong>
                    <div className="suggestion-actions">
                        <img
                            src={isFavorite ? heartFilled : heartEmpty}
                            alt={onRemoveFromFavorites && favoriteId ? "Видалити з обраних" : "Обране"}
                            className="favorite-icon"
                            onClick={toggleFavorite}
                            title={onRemoveFromFavorites && favoriteId ? "Видалити з обраних" : (isFavorite ? "Видалити з обраного" : "Додати в обране")}
                        />
                    </div>
                </div>

                {item.address_obj?.address_string && (
                    <p className="suggestion-address">{item.address_obj.address_string}</p>
                )}

                {(item.rating_image_url) && (
                    <div className="suggestion-image">
                        <img
                            src={item.rating_image_url}
                            alt={item.name}
                            onError={(e) => {
                                console.error("❌ Image load error for:", item.name, e.target.src);
                                e.target.style.display = 'none';
                            }}
                        />
                    </div>
                )}

                {item.rating && (
                    <p className="suggestion-rating">
                        Рейтинг: {item.rating} ({item.num_reviews || 0} відгуків)
                    </p>
                )}

                {item.web_url ? (
                    <button className="button" onClick={() => window.open(item.web_url, '_blank')}>
                        Деталі
                    </button>
                ) : (
                    <p className="no-link">Посилання недоступне</p>
                )}
            </div>
        </div>
    );
};

export default SuggestionCard;