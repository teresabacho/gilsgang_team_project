import React, { useContext, useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import { UserContext } from "../context/UserContext";
import Header from "../components/Header";
import Footer from "../components/Footer";
import axios from "axios";
import L from "leaflet";
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';
import '../styles/routepage.css';
import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

L.Icon.Default.mergeOptions({ iconRetinaUrl, iconUrl, shadowUrl });


const RouteController = ({ routeData, onRouteReady, onRoutePanelCreate }) => {
    const map = useMap();
    const controlRef = useRef(null);
    const isCreatingRoute = useRef(false);
    const routeCreatedRef = useRef(false);

    const waypoints = React.useMemo(() => {
        if (!routeData || !routeData.data || routeData.data.length < 2) {
            return null;
        }

        return routeData.data.map((loc, index) => {
            let lat, lng;
            if (Array.isArray(loc.coordinates)) {
                lat = loc.coordinates[0];
                lng = loc.coordinates[1];
            } else if (loc.lat && loc.lng) {
                lat = loc.lat;
                lng = loc.lng;
            } else if (loc.latitude && loc.longitude) {
                lat = loc.latitude;
                lng = loc.longitude;
            } else {
                console.error("Невідомий формат координат:", loc);
                return null;
            }

            return { lat, lng, title: loc.title || `Точка ${index + 1}`, description: loc.description };
        }).filter(wp => wp !== null);
    }, [routeData]);

    const createRoute = useCallback(() => {
        if (!map || !waypoints || waypoints.length < 2 || isCreatingRoute.current || routeCreatedRef.current) {
            return;
        }

        console.log("Створення маршруту з waypoints:", waypoints);
        isCreatingRoute.current = true;

        try {
            const leafletWaypoints = waypoints.map(wp => L.latLng(wp.lat, wp.lng));

            let control;

            if (!process.env.REACT_APP_MAPBOX_TOKEN) {
                console.log("Використовуємо OpenStreetMap router");

                control = L.Routing.control({
                    waypoints: leafletWaypoints,
                    routeWhileDragging: false,
                    addWaypoints: false,
                    draggableWaypoints: false,
                    show: false,
                    fitSelectedRoutes: true,
                    lineOptions: {
                        styles: [{
                            color: '#3388ff',
                            opacity: 0.8,
                            weight: 6
                        }]
                    },
                    createMarker: (i, wp) => {
                        const location = waypoints[i];
                        return L.marker(wp.latLng)
                            .bindPopup(`
                                <div class="marker-popup">
                                    <h4>${location?.title || `Точка ${i + 1}`}</h4>
                                  
                                </div>
                            `);
                    },
                });

            } else {
                console.log("Використовуємо Mapbox router");
                const router = L.Routing.mapbox(process.env.REACT_APP_MAPBOX_TOKEN, {
                    profile: 'mapbox/driving',
                    language: 'uk'
                });

                control = L.Routing.control({
                    waypoints: leafletWaypoints,
                    router,
                    routeWhileDragging: false,
                    addWaypoints: false,
                    draggableWaypoints: false,
                    show: false,
                    fitSelectedRoutes: true,
                    lineOptions: {
                        styles: [{
                            color: '#3388ff',
                            opacity: 0.8,
                            weight: 6
                        }]
                    },
                    createMarker: (i, wp) => {
                        const location = waypoints[i];
                        return L.marker(wp.latLng)
                            .bindPopup(`
                                <div class="marker-popup">
                                    <h4>${location?.title || `Точка ${i + 1}`}</h4>
                                    <p>Координати: ${wp.latLng.lat.toFixed(6)}, ${wp.latLng.lng.toFixed(6)}</p>
                                    ${location?.description ? `<p>${location.description}</p>` : ''}
                                </div>
                            `);
                    },
                });
            }


            control.addTo(map);
            controlRef.current = control;
            routeCreatedRef.current = true;


            const createRoutePanel = () => {
                const mapContainer = map.getContainer();
                const panelContainer = document.getElementById("routing-panel");
                if (!panelContainer) return;

                panelContainer.innerHTML = "";

                const groupPanel = document.createElement("div");
                groupPanel.className = "custom-routing-container";
                groupPanel.setAttribute("data-route-id", routeData.externalId || routeData._id);


                const header = document.createElement("div");
                header.className = "routing-header";
                const title = document.createElement("h2");
                title.textContent = routeData.name || 'Деталі маршруту';
                header.appendChild(title);
                groupPanel.appendChild(header);


                const suggestionsContainer = document.createElement("div");
                suggestionsContainer.className = "route-suggestions-container";
                suggestionsContainer.setAttribute("data-for-route", routeData.externalId || routeData._id);

                panelContainer.appendChild(groupPanel);


                setTimeout(() => {
                    const leafletPanel = mapContainer.querySelector(".leaflet-routing-container");
                    if (leafletPanel) {
                        leafletPanel.style.display = 'block';
                        groupPanel.appendChild(leafletPanel);
                    }


                    groupPanel.appendChild(suggestionsContainer);


                    if (onRoutePanelCreate) {
                        onRoutePanelCreate(suggestionsContainer);
                    }
                }, 100);


                groupPanel.addEventListener("click", () => {
                    if (controlRef.current && controlRef.current.getRouter) {

                        const route = controlRef.current.getRoutes ? controlRef.current.getRoutes()[0] : null;
                        if (route && route.bounds) {
                            map.fitBounds(route.bounds);
                        }
                    }
                });
            };


            control.on("routesfound", (e) => {
                console.log("Маршрут знайдено:", e.routes);
                isCreatingRoute.current = false;

                if (e.routes && e.routes.length > 0) {
                    const route = e.routes[0];


                    if (route.bounds) {
                        map.fitBounds(route.bounds);
                    }


                    createRoutePanel();


                    setTimeout(() => {
                        const container = document.querySelector(".leaflet-routing-alt");
                        if (container) {
                            const summaryElem = container.querySelector("h2");
                            if (summaryElem && routeData.data) {
                                summaryElem.innerHTML = routeData.data.map((loc, idx) =>
                                    `${idx + 1}. ${loc.title || `Точка ${idx + 1}`}`
                                ).join("<br>");
                            }
                        }
                    }, 300);


                    if (onRouteReady) {
                        onRouteReady({
                            distance: route.summary ? (route.summary.totalDistance / 1000).toFixed(2) : null,
                            duration: route.summary ? Math.round(route.summary.totalTime / 60) : null,
                            waypoints: route.waypoints
                        });
                    }
                }
            });

            control.on("routingerror", (e) => {
                console.error("Помилка побудови маршруту:", e);
                isCreatingRoute.current = false;
            });

        } catch (error) {
            console.error("Помилка створення маршруту:", error);
            isCreatingRoute.current = false;
        }
    }, [map, waypoints, onRouteReady, onRoutePanelCreate, routeData]);


    const clearRoute = useCallback(() => {
        if (controlRef.current && map) {
            try {
                if (map.hasLayer && map.hasLayer(controlRef.current)) {
                    map.removeControl(controlRef.current);
                }
            } catch (e) {
                console.warn("Помилка при видаленні контролю:", e);
            }
            controlRef.current = null;
            routeCreatedRef.current = false;
            isCreatingRoute.current = false;
        }


        const panelContainer = document.getElementById("routing-panel");
        if (panelContainer) {
            panelContainer.innerHTML = "";
        }
    }, [map]);

    useEffect(() => {
        if (!map || !waypoints) {
            console.log("Недостатньо даних для маршруту");
            return;
        }


        clearRoute();


        const timeoutId = setTimeout(() => {
            createRoute();
        }, 100);


        return () => {
            clearTimeout(timeoutId);
        };

    }, [map, waypoints, createRoute, clearRoute]);


    useEffect(() => {
        return () => {
            clearRoute();
        };
    }, [clearRoute]);

    return null;
};

const RouteMapDisplay = ({ routeData, onRouteReady, onRoutePanelCreate }) => {

    const getMapCenter = () => {
        if (routeData?.data && routeData.data.length > 0) {
            const firstPoint = routeData.data[0];
            if (Array.isArray(firstPoint.coordinates)) {
                return [firstPoint.coordinates[0], firstPoint.coordinates[1]];
            } else if (firstPoint.lat && firstPoint.lng) {
                return [firstPoint.lat, firstPoint.lng];
            }
        }
        return [50.4501, 30.5234];
    };

    return (
        <div className="route-map-wrapper">
            <MapContainer
                center={getMapCenter()}
                zoom={8}
                style={{ height: "500px", width: "100%" }}
                key={routeData?._id || 'default'}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />
                <RouteController
                    routeData={routeData}
                    onRouteReady={onRouteReady}
                    onRoutePanelCreate={onRoutePanelCreate}
                />
            </MapContainer>



        </div>
    );
};

export default function RouteDetailsPage() {
    const { routeId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(UserContext);

    const [routeData, setRouteData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isFavorite, setIsFavorite] = useState(true);
    const [routeInfo, setRouteInfo] = useState(null);
    const [favoriteId, setFavoriteId] = useState(null);
    const [suggestionsContainer, setSuggestionsContainer] = useState(null);
    const [formattedFavoriteRoute, setFormattedFavoriteRoute] = useState(null);

    useEffect(() => {
        fetchRouteData();
    }, [routeId, user]);

    useEffect(() => {

        if (routeData && isFavorite) {
            const formatted = {
                _id: routeData._id,
                type: routeData.type,
                externalId: routeData.externalId,
                name: routeData.name,
                location: routeData.location,
                data: routeData.data,
                createdAt: routeData.createdAt,
                updatedAt: routeData.updatedAt,
                groupIndex: 0
            };
            setFormattedFavoriteRoute(formatted);
        } else {
            setFormattedFavoriteRoute(null);
        }
    }, [routeData, isFavorite]);

    const fetchRouteData = async () => {
        try {
            setLoading(true);

            const response = await axios.get(`/api/user/favorites/item/${routeId}`, {
                withCredentials: true
            });

            console.log("Отримані дані маршруту:", response.data);

            if (response.data && response.data.favorite) {
                const favorite = response.data.favorite;

                if (favorite.type !== 'route') {
                    setError("Цей елемент не є маршрутом");
                    return;
                }

                const routeDataFormatted = {
                    _id: favorite._id,
                    name: favorite.name,
                    type: favorite.type,
                    externalId: favorite.externalId,
                    location: favorite.location,
                    data: favorite.data,
                    createdAt: favorite.createdAt,
                    updatedAt: favorite.updatedAt
                };

                console.log("Форматовані дані маршруту:", routeDataFormatted);

                setRouteData(routeDataFormatted);
                setFavoriteId(favorite._id);
                setIsFavorite(true);
            } else {
                setError("Маршрут не знайдено в обраних");
            }

        } catch (error) {
            console.error("Error fetching route:", error);
            if (error.response?.status === 404) {
                setError("Маршрут не знайдено в ваших обраних");
            } else {
                setError("Помилка завантаження маршруту");
            }
        } finally {
            setLoading(false);
        }
    };




    const handleRouteReady = useCallback((info) => {
        console.log("Інформація про маршрут:", info);
        setRouteInfo(prevInfo => {

            if (JSON.stringify(prevInfo) !== JSON.stringify(info)) {
                return info;
            }
            return prevInfo;
        });
    }, []);


    const handleRoutePanelCreate = useCallback((container) => {
        setSuggestionsContainer(container);
    }, []);

    if (loading) {
        return (
            <div>
                <Header />
                <div className="loading">Завантаження маршруту...</div>
                <Footer />
            </div>
        );
    }

    if (error || !routeData) {
        return (
            <div>
                <Header />
                <div className="error-container">
                    <h2>Помилка</h2>
                    <p>{error || "Маршрут не знайдено"}</p>
                    <button
                        className="button"
                        onClick={() => navigate('/favorites')}
                    >
                        Повернутися до обраних
                    </button>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div>
            <Header />

            <div className="routes-wrapper">
                <div className="left-panel">

                        <div id="routing-panel" className="routing-panel"></div>


                </div>

                <div className ="map-wrapper">
                    <RouteMapDisplay
                        routeData={routeData}
                        onRouteReady={handleRouteReady}
                        onRoutePanelCreate={handleRoutePanelCreate}
                    />
                </div>

            </div>




            <Footer />
        </div>
    );
}