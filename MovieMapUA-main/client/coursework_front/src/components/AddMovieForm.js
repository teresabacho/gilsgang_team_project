import React, { useState } from "react";
import axios from "axios";

export default function AddMovieForm({ onClose }) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [year, setYear] = useState("");
    const [director, setDirector] = useState("");
    const [genre, setGenre] = useState("");
    const [posterUrl, setPosterUrl] = useState("");
    const [locations, setLocations] = useState([{
        title: "",
        coordinates: "",
        isSearching: false,
        searchResults: [],
        showResults: false,
        isLocationSet: false
    }]);

    const handleAddLocation = () => {
        setLocations([...locations, {
            title: "",
            coordinates: "",
            isSearching: false,
            searchResults: [],
            showResults: false,
            isLocationSet: false
        }]);
    };

    const handleRemoveLocation = (index) => {
        if (locations.length > 1) {
            const newLocations = locations.filter((_, i) => i !== index);
            setLocations(newLocations);
        }
    };

    const handleLocationChange = (index, field, value) => {
        const newLocations = [...locations];
        newLocations[index][field] = value;


        if (field === 'title' && !newLocations[index].isLocationSet) {
            newLocations[index].showResults = false;
            newLocations[index].searchResults = [];
        }

        setLocations(newLocations);
    };

    const searchLocation = async (index, locationName) => {
        if (!locationName.trim()) return;

        const newLocations = [...locations];
        newLocations[index].isSearching = true;
        newLocations[index].showResults = false;
        setLocations([...newLocations]);

        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationName)}&limit=5&addressdetails=1`,
                {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'YourAppName/1.0'
                    }
                }
            );

            const data = await response.json();

            const updatedLocations = [...locations];
            updatedLocations[index].searchResults = data || [];
            updatedLocations[index].showResults = (data || []).length > 0;
            updatedLocations[index].isSearching = false;

            setLocations([...updatedLocations]);

        } catch (error) {
            console.error("Помилка геокодування:", error);
            const updatedLocations = [...locations];
            updatedLocations[index].isSearching = false;
            updatedLocations[index].showResults = false;
            setLocations([...updatedLocations]);
        }
    };

    const selectLocation = (index, selectedResult) => {
        const newLocations = [...locations];
        newLocations[index].coordinates = `${selectedResult.lat}, ${selectedResult.lon}`;
        newLocations[index].title = selectedResult.display_name;
        newLocations[index].showResults = false;
        newLocations[index].searchResults = [];
        newLocations[index].isLocationSet = true;
        setLocations([...newLocations]);
    };

    const closeSearchResults = (index) => {
        const newLocations = [...locations];
        newLocations[index].showResults = false;
        setLocations([...newLocations]);
    };

    const parseCoordinates = (coordinates) => {
        const [latitude, longitude] = coordinates.split(/[ ,]+/).map(coord => parseFloat(coord));
        if (!isNaN(latitude) && !isNaN(longitude)) {
            return [latitude, longitude];
        }
        throw new Error("Invalid coordinates format");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const movieRes = await axios.post("/api/movie/", {
                title,
                description,
                year,
                director,
                genre,
                posterUrl
            });

            const movieId = movieRes.data.movie._id;
            await Promise.all(
                locations.map(location => {
                    const [latitude, longitude] = parseCoordinates(location.coordinates);
                    return axios.post("/api/location/", {
                        title: location.title,
                        coordinates: [latitude, longitude],
                        movie: movieId
                    });
                })
            );

            onClose();
        } catch (err) {
            console.error("Error adding movie:", err);
        }
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <h2>Додати Фільм</h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>Назва:</label>
                        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
                    </div>
                    <div>
                        <label>Опис:</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
                    </div>
                    <div>
                        <label>Рік випуску:</label>
                        <input value={year} onChange={(e) => setYear(e.target.value)} required />
                    </div>
                    <div>
                        <label>Режисер:</label>
                        <input value={director} onChange={(e) => setDirector(e.target.value)} required />
                    </div>
                    <div>
                        <label>Жанр:</label>
                        <input value={genre} onChange={(e) => setGenre(e.target.value)} required />
                    </div>
                    <div>
                        <label>Постер URL:</label>
                        <input value={posterUrl} onChange={(e) => setPosterUrl(e.target.value)} required />
                    </div>

                    <h3>Локації</h3>
                    {locations.map((location, index) => (
                        <div key={index} style={{ marginBottom: '20px', border: '1px solid #ccc', padding: '10px', position: 'relative' }}>

                            {locations.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveLocation(index)}
                                    style={{
                                        position: 'absolute',
                                        top: '5px',
                                        right: '5px',
                                        background: '#ff4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '50%',
                                        width: '25px',
                                        height: '25px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                    title="Видалити локацію"
                                >
                                    ✕
                                </button>
                            )}

                            <div>
                                <label>Назва локації:</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input
                                        value={location.title}
                                        onChange={(e) => handleLocationChange(index, "title", e.target.value)}
                                        placeholder="Введіть назву локації..."
                                        required
                                    />

                                    {!location.isLocationSet && (
                                        <button
                                            type="button"
                                            className="button"
                                            onClick={() => searchLocation(index, location.title)}
                                            disabled={location.isSearching}
                                        >
                                            {location.isSearching ? "Пошук..." : "Знайти"}
                                        </button>
                                    )}
                                    {location.isLocationSet && (
                                        <button
                                            type="button"
                                            className="button"
                                            onClick={() => {
                                                const newLocations = [...locations];
                                                newLocations[index].isLocationSet = false;
                                                newLocations[index].coordinates = "";
                                                setLocations(newLocations);
                                            }}
                                            style={{ backgroundColor: '#28a745' }}
                                        >
                                            ✓ Обрано
                                        </button>
                                    )}
                                </div>
                            </div>

                            {location.showResults && (
                                <div style={{
                                    marginTop: '10px',
                                    border: '1px solid #ddd',
                                    maxHeight: '200px',
                                    overflowY: 'auto',
                                    backgroundColor: '#f9f9f9',
                                    zIndex: 1000,
                                    position: 'relative'
                                }}>
                                    <div style={{ padding: '5px', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between' }}>
                                        <strong>Результати пошуку:</strong>
                                        <button
                                            type="button"
                                            onClick={() => closeSearchResults(index)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    {location.searchResults.map((result, resultIndex) => (
                                        <div
                                            key={resultIndex}
                                            style={{
                                                padding: '8px',
                                                cursor: 'pointer',
                                                borderBottom: '1px solid #eee'
                                            }}
                                            onClick={() => selectLocation(index, result)}
                                            onMouseEnter={(e) => e.target.style.backgroundColor = '#e9e9e9'}
                                            onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                                        >
                                            <div style={{ fontWeight: 'bold' }}>
                                                {result.name || result.display_name.split(',')[0]}
                                            </div>
                                            <div style={{ fontSize: '0.9em', color: '#666' }}>
                                                {result.display_name}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div>
                                <label>Координати:</label>
                                <input
                                    value={location.coordinates}
                                    placeholder="48.8588443, 2.2943506 (або знайдіть автоматично)"
                                    onChange={(e) => handleLocationChange(index, "coordinates", e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    ))}

                    <button type="button" className="button" onClick={handleAddLocation}>
                        Додати локацію
                    </button>

                    <div>
                        <button className="button" type="submit">Додати фільм</button>
                        <button className="button" type="button" onClick={onClose}>Скасувати</button>
                    </div>
                </form>
            </div>
        </div>
    );
}