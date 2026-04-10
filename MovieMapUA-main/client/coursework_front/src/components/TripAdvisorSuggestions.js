import React, { useEffect, useState, useContext, useRef } from "react";
import '../styles/routes.css';
import '../styles/movieitem.css';
import { UserContext } from "../context/UserContext";
import axios from "axios";
import { createRoot } from 'react-dom/client';
import SuggestionCard from './SuggestionCard';

const SuggestionsContent = ({ hotels, attractions, loading, error, localFavorites, setLocalFavorites }) => (
    <div className="tripadvisor-suggestions">
        {loading && <p>Завантаження рекомендацій...</p>}
        {error && <p className="error">{error}</p>}

        {!loading && !error && hotels.length === 0 && attractions.length === 0 && (
            <p>Немає рекомендацій для вибраного маршруту</p>
        )}

        {!loading && !error && (hotels.length > 0 || attractions.length > 0) && (
            <>
                {hotels.length > 0 && (
                    <>
                        <div className="routing-header">
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                                Рекомендовані готелі
                            </h3>
                        </div>
                        <div className="suggestion-list">
                            {hotels.map(item => (
                                <SuggestionCard
                                    key={item.location_id}
                                    item={item}
                                    type="hotel"
                                    localFavorites={localFavorites}
                                    setLocalFavorites={setLocalFavorites}
                                />
                            ))}
                        </div>
                    </>
                )}

                {attractions.length > 0 && (
                    <>
                        <div className="routing-header">
                            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                                Рекомендовані екскурсії
                            </h3>
                        </div>

                        <div className="suggestion-list">
                            {attractions.map(item => (
                                <SuggestionCard
                                    key={item.location_id}
                                    item={item}
                                    type="attraction"
                                    localFavorites={localFavorites}
                                    setLocalFavorites={setLocalFavorites}
                                />
                            ))}
                        </div>
                    </>
                )}
            </>
        )}
    </div>
);

const TripAdvisorSuggestions = ({ favoriteRoutes, containerElement, routeId }) => {
    const [hotels, setHotels] = useState([]);
    const [attractions, setAttractions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [ready, setReady] = useState(false);
    const [localFavorites, setLocalFavorites] = useState({});
    const rootRef = useRef(null);
    const mountNodeRef = useRef(null);
    const { user } = useContext(UserContext);


    useEffect(() => {
        if (user?.favorites) {
            const favoriteStatus = {};
            [...hotels, ...attractions].forEach(item => {
                const isFavorite = user.favorites.some(
                    fav => (fav.type === "hotel" || fav.type === "attraction") &&
                        fav.externalId === item.location_id
                );
                favoriteStatus[item.location_id] = isFavorite;
            });

            setLocalFavorites(prev => {
                const hasChanged = JSON.stringify(prev) !== JSON.stringify(favoriteStatus);
                return hasChanged ? favoriteStatus : prev;
            });
        }
    }, [user, hotels, attractions]);


    useEffect(() => {
        let isMounted = true;

        const fetchSuggestions = async () => {
            setError(null);
            setLoading(true);
            setHotels([]);
            setAttractions([]);
            setReady(false);

            if (!favoriteRoutes || favoriteRoutes.length === 0) {
                if (isMounted) {
                    setError("Немає маршрутів для рекомендацій");
                    setLoading(false);
                    setReady(true);
                }
                return;
            }

            const route = favoriteRoutes[0];
            if (!route) {
                if (isMounted) {
                    setError("Немає даних про маршрут");
                    setLoading(false);
                    setReady(true);
                }
                return;
            }

            let lat, lng;
            if (route.location?.lat && route.location?.lng) {
                lat = route.location.lat;
                lng = route.location.lng;
            } else if (Array.isArray(route.data) && route.data.length > 0) {
                const first = route.data[0];
                if (Array.isArray(first.coordinates)) {
                    [lat, lng] = first.coordinates;
                } else {
                    lat = first.lat;
                    lng = first.lng;
                }
            }

            if (lat == null || lng == null) {
                setError("Немає координат для пошуку рекомендацій");
                setLoading(false);
                setReady(true);
                return;
            }

            try {
                const movieTitle = route.movieTitle || route.title || "";

                const [hRes, aRes] = await Promise.all([
                    fetch(`/api/suggestions?lat=${lat}&lng=${lng}&category=hotels&limit=5`),
                    fetch(`/api/suggestions?lat=${lat}&lng=${lng}&category=attractions&limit=5&movie=${encodeURIComponent(movieTitle)}`)
                ]);

                if (!hRes.ok || !aRes.ok) throw new Error("API error");

                const hJson = await hRes.json();
                const aJson = await aRes.json();

                const topHotels = (hJson.data || [])
                    .filter(h => h.location_id)
                    .sort((a, b) => (b.num_reviews || 0) - (a.num_reviews || 0))
                    .slice(0, 3);

                const topAttractions = (aJson.data || [])
                    .filter(a => a.location_id)
                    .sort((a, b) => (b.num_reviews || 0) - (a.num_reviews || 0))
                    .slice(0, 3);

                if (isMounted) {
                    setHotels(topHotels);
                    setAttractions(topAttractions);
                }
            } catch (err) {
                console.error(err);
                if (isMounted) setError("Не вдалося отримати рекомендації");
            } finally {
                if (isMounted) {
                    setLoading(false);
                    setReady(true);
                }
            }
        };

        fetchSuggestions();

        return () => {
            isMounted = false;
        };
    }, [favoriteRoutes]);


    useEffect(() => {
        if (!containerElement || !ready || !routeId) return;


        if (!mountNodeRef.current) {
            const mountNode = document.createElement('div');
            mountNode.className = 'tripadvisor-suggestions-root';
            mountNode.setAttribute('data-route-id', routeId);


            const existingNode = containerElement.querySelector(`[data-route-id="${routeId}"]`);
            if (existingNode) {
                existingNode.remove();
            }

            containerElement.appendChild(mountNode);
            mountNodeRef.current = mountNode;
        }


        if (!rootRef.current && mountNodeRef.current) {
            const root = createRoot(mountNodeRef.current);
            rootRef.current = root;
        }


        if (rootRef.current) {
            rootRef.current.render(
                <SuggestionsContent
                    hotels={hotels}
                    attractions={attractions}
                    loading={loading}
                    error={error}
                    localFavorites={localFavorites}
                    setLocalFavorites={setLocalFavorites}
                />
            );
        }
    }, [containerElement, ready, hotels, attractions, loading, error, localFavorites, routeId]);


    useEffect(() => {
        return () => {
            setTimeout(() => {
                if (rootRef.current) {
                    try {
                        rootRef.current.unmount();
                    } catch (e) {
                        console.error("Unmount error:", e);
                    }
                    rootRef.current = null;
                }

                if (mountNodeRef.current && containerElement?.contains(mountNodeRef.current)) {
                    containerElement.removeChild(mountNodeRef.current);
                    mountNodeRef.current = null;
                }
            }, 0);
        };
    }, [containerElement]);

    return null;
};

export default TripAdvisorSuggestions;