import React, { useContext, useEffect, useRef, useState } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import heartFilled from '../images/heart-filled.png';
import heartEmpty from '../images/heart-empty.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import { UserContext } from "../context/UserContext";
import axios from "axios";
import TripAdvisorSuggestions from "./TripAdvisorSuggestions";
import AuthModal from "./AuthModal";
L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });

function getDistance(coord1, coord2) {
    const toRad = val => (val * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(coord2[0] - coord1[0]);
    const dLon = toRad(coord2[1] - coord1[1]);
    const lat1 = toRad(coord1[0]);
    const lat2 = toRad(coord2[0]);
    const a = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function groupLocations(locations, radiusKm = 500) {
    const groups = [];
    locations.forEach(loc => {
        let added = false;
        for (const group of groups) {
            if (getDistance(group[0].coordinates, loc.coordinates) <= radiusKm) {
                group.push(loc);
                added = true;
                break;
            }
        }
        if (!added) groups.push([loc]);
    });
    return groups;
}

function splitIntoChunks(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
}

const Routing = ({ locations, onFavoritesUpdate }) => {
    const map = useMap();
    const controlsRef = useRef([]);
    const [favoriteRoutes, setFavoriteRoutes] = useState({});
    const [userFavoriteRoutes, setUserFavoriteRoutes] = useState([]);
    const [routeSuggestionContainers, setRouteSuggestionContainers] = useState({});
    const [showAuthModal, setShowAuthModal] = useState(false);

    const { user } = useContext(UserContext);

    useEffect(() => {
        if (user && user.favorites && locations.length > 0) {
            const favoriteStatus = {};
            const userFavs = [];

            const groups = groupLocations(locations);
            const limitedGroups = [];

            groups.forEach(group => {
                if (group.length > 25) {
                    const subGroups = splitIntoChunks(group, 25);
                    limitedGroups.push(...subGroups);
                } else {
                    limitedGroups.push(group);
                }
            });

            limitedGroups.forEach(group => {
                const externalId = group.map(loc => loc._id).join("_");
                const isFavorite = user.favorites.some(
                    fav => fav.type === "route" && fav.externalId === externalId
                );
                favoriteStatus[externalId] = isFavorite;

                const existing = user.favorites.find(
                    fav => fav.type === "route" && fav.externalId === externalId
                );

                if (isFavorite && existing) {
                    userFavs.push({
                        ...existing,
                        groupIndex: limitedGroups.findIndex(g =>
                            g.map(loc => loc._id).join("_") === externalId
                        )
                    });
                }
            });

            setFavoriteRoutes(prev => {
                const hasChanged = JSON.stringify(prev) !== JSON.stringify(favoriteStatus);
                return hasChanged ? favoriteStatus : prev;
            });

            setUserFavoriteRoutes(prev => {
                const hasChanged = JSON.stringify(prev) !== JSON.stringify(userFavs);
                return hasChanged ? userFavs : prev;
            });
        }
    }, [user, locations]);

    useEffect(() => {
        if (onFavoritesUpdate && typeof onFavoritesUpdate === 'function') {
            onFavoritesUpdate(userFavoriteRoutes);
        }
    }, [userFavoriteRoutes, onFavoritesUpdate]);

    useEffect(() => {
        if (!locations || locations.length < 2) return;

        const mapContainer = map.getContainer();
        const panelContainer = document.getElementById("routing-panel");
        if (!panelContainer) return;
        panelContainer.innerHTML = "";

        const groups = groupLocations(locations);
        const limitedGroups = [];
        const newSuggestionContainers = {};

        groups.forEach(group => {
            if (group.length > 25) {
                const subGroups = splitIntoChunks(group, 25);
                limitedGroups.push(...subGroups);
            } else {
                limitedGroups.push(group);
            }
        });

        limitedGroups.forEach((group, groupIndex) => {
            const externalId = group.map(loc => loc._id).join("_");

            const startPoint = group[0]?.title || 'Початок';
            const endPoint = group[group.length - 1]?.title || 'Кінець';
            const name = `Маршрут ${startPoint} - ${endPoint}`;

            const location = group[0]?.coordinates
                ? { lat: group[0].coordinates[0], lng: group[0].coordinates[1] }
                : null;
            const data = group;
            const isFavorite = favoriteRoutes[externalId] || false;

            const heartImg = document.createElement("img");
            heartImg.src = isFavorite ? heartFilled : heartEmpty;
            heartImg.className = "favorite-icon";
            heartImg.style.cursor = "pointer";

            const groupPanel = document.createElement("div");
            groupPanel.className = "custom-routing-container";
            groupPanel.setAttribute("data-route-id", externalId);

            const header = document.createElement("div");
            header.className = "routing-header";
            const title = document.createElement("h2");
            title.textContent = name;
            header.appendChild(title);
            header.appendChild(heartImg);
            groupPanel.appendChild(header);

            const suggestionsContainer = document.createElement("div");
            suggestionsContainer.className = "route-suggestions-container";
            suggestionsContainer.setAttribute("data-for-route", externalId);

            newSuggestionContainers[externalId] = suggestionsContainer;

            heartImg.addEventListener("click", async (e) => {
                e.stopPropagation();

                if (!user) {
                    setShowAuthModal(true);
                    return;
                }

                try {
                    if (isFavorite) {
                        await axios.delete("/api/favorites/remove", {
                            data: { type: "route", externalId }
                        });

                        setFavoriteRoutes(prev => ({
                            ...prev,
                            [externalId]: false
                        }));

                        setUserFavoriteRoutes(prev =>
                            prev.filter(route =>
                                !(route.type === "route" && route.externalId === externalId)
                            )
                        );

                        if (suggestionsContainer) {
                            suggestionsContainer.innerHTML = '';
                        }

                        heartImg.src = heartEmpty;
                    } else {
                        const response = await axios.post("/api/favorites/add", {
                            type: "route",
                            externalId,
                            name,
                            location,
                            data
                        });

                        setFavoriteRoutes(prev => ({
                            ...prev,
                            [externalId]: true
                        }));

                        if (response.data && response.data.favorite) {
                            setUserFavoriteRoutes(prev => [
                                ...prev.filter(route =>
                                    !(route.type === "route" && route.externalId === externalId)
                                ),
                                {
                                    ...response.data.favorite,
                                    groupIndex
                                }
                            ]);
                        }

                        heartImg.src = heartFilled;
                    }
                } catch (error) {
                    console.error("Error toggling favorite status:", error);
                }
            });

            if (group.length < 2) return;

            panelContainer.appendChild(groupPanel);

            const waypoints = group.map(loc => L.latLng(loc.coordinates[0], loc.coordinates[1]));

            const router = L.Routing.mapbox(process.env.REACT_APP_MAPBOX_TOKEN, {
                profile: 'mapbox/driving',
                language: 'uk'
            });

            controlsRef.current.forEach(control => map.removeControl(control));
            controlsRef.current = [];

            const control = L.Routing.control({
                waypoints,
                router,
                routeWhileDragging: false,
                addWaypoints: false,
                draggableWaypoints: false,
                show: false,
                fitSelectedRoutes: groupIndex === 0,
                lineOptions: { styles: [{ opacity: 0.7, weight: 5 }] },
                createMarker: (i, wp) => L.marker(wp.latLng).bindPopup(group[i]?.title),
            }).addTo(map);

            setTimeout(() => {
                const leafletPanel = mapContainer.querySelector(".leaflet-routing-container");
                if (leafletPanel) {
                    groupPanel.appendChild(leafletPanel);
                }

                groupPanel.appendChild(suggestionsContainer);
            }, 100);

            control.on("routesfound", e => {
                if (!e.routes.length) {
                    groupPanel.innerHTML = `<p>Маршрут не знайдено.</p>`;
                    return;
                }
                const [route] = e.routes;
                if (route.bounds) {
                    groupPanel.dataset.bounds = JSON.stringify(route.bounds);
                    if (groupIndex === 0) map.fitBounds(route.bounds);
                }

                setTimeout(() => {
                    const container = groupPanel.querySelector(".leaflet-routing-alt");
                    if (container) {
                        const summaryElem = container.querySelector("h2");
                        if (summaryElem) {
                            summaryElem.innerHTML = group.map((loc, idx) => `${idx + 1}. ${loc.title}`).join("<br>");
                        }
                    }
                }, 300);
            });

            groupPanel.addEventListener("click", () => {
                const boundsStr = groupPanel.dataset.bounds;
                if (boundsStr) {
                    const bounds = JSON.parse(boundsStr);
                    const leafletBounds = L.latLngBounds(
                        L.latLng(bounds._southWest.lat, bounds._southWest.lng),
                        L.latLng(bounds._northEast.lat, bounds._northEast.lng)
                    );
                    map.fitBounds(leafletBounds);
                }
            });
        });

        setRouteSuggestionContainers(newSuggestionContainers);
    }, [map, locations, favoriteRoutes, user]);

    return (
        <>
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
            />

            {userFavoriteRoutes.map(route => {
                const container = routeSuggestionContainers[route.externalId];

                if (!container) return null;

                return (
                    <TripAdvisorSuggestions
                        key={`suggestions-${route.externalId}`}
                        favoriteRoutes={[route]}
                        containerElement={container}
                        routeId={route.externalId}
                    />
                );
            })}
        </>
    );
};

export default Routing;