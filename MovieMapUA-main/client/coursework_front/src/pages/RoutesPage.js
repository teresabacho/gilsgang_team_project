import '../styles/header.css';
import '../styles/routes.css';
import Header from "../components/Header";
import Footer from "../components/Footer";
import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import L from "leaflet";
import "leaflet-routing-machine";
import Routing from "../components/Routing";

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
});

export default function RoutesPage() {
    const { movieTitle, locations } = useLocation().state || {};
    const [favoriteRoutes, setFavoriteRoutes] = useState([]);

    const handleFavoritesUpdate = (routesFromRouting) => {
        setFavoriteRoutes(routesFromRouting);
    };

    return (
        <div>
            <Header />
            <div className="routes-wrapper">
                <div className="left-panel">
                    <h1 style={{ color: '#EDF6F9' }}>Маршрути {movieTitle}</h1>
                    <div id="routing-panel" />

                </div>

                <div className="map-wrapper">
                    <MapContainer
                        center={[49.0275, 31.482778]}
                        zoom={5}
                        maxZoom={18}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; OpenStreetMap contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Routing locations={locations} onFavoritesUpdate={handleFavoritesUpdate} />
                    </MapContainer>
                </div>
            </div>
            <Footer />
        </div>
    );
}