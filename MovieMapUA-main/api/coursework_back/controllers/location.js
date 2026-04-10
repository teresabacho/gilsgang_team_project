const Location = require ("../models/Location");
const Movie = require ("../models/Movie");


exports.newLocation = async (req, res) => {
    const { movie, title, coordinates } = req.body;

    let existingMovie;
    try {
        existingMovie = await Movie.findById(movie);
    } catch (err) {
        console.error("Error finding movie by ID:", err);
        return res.status(500).json({ message: "Internal Server Error" });
    }

    if (!existingMovie) {
        return res.status(404).json({ message: "Movie Not Found With Given ID" });
    }

    let location;
    try {
        location = new Location({
            movie,
            title,
            coordinates
        });

        await location.save();
        existingMovie.locations.push(location);
        await existingMovie.save();
    } catch (err) {
        console.error("Error creating location:", err);
        return res.status(500).json({ message: "Unable to create a location", error: err.message });
    }

    return res.status(201).json({ location });
};


exports.getLocationById = async (req, res) => {
    const id = req.params.id;

    try {
        const location = await Location.findById(id);
        if (!location) {
            return res.status(404).json({ message: "Location Not Found" });
        }
        return res.status(200).json({ location });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
exports.getLocationsByMovieId = async (req, res) => {
    const movieId = req.params.movieId;

    try {
        const movie = await Movie.findById(movieId).populate('locations');
        if (!movie) {
            return res.status(404).json({ message: "Movie Not Found" });
        }
        return res.status(200).json({ locations: movie.locations });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

exports.updateLocation = async (req, res) => {
    const { title, coordinates } = req.body;

    let location;
    try {
        location = await Location.findById(req.params.id);
        if (!location) {
            return res.status(404).json({ message: "Location Not Found" });
        }

        location.title = title;
        location.coordinates = coordinates;

        await location.save();
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Unable to update the location" });
    }

    return res.status(200).json({ location });
};

exports.deleteLocation = async (req, res) => {
    const locationId = req.params.id;

    try {

        const location = await Location.findById(locationId);


        if (!location) {
            return res.status(404).json({ message: "Location Not Found" });
        }


        const movie = await Movie.findByIdAndUpdate(location.movie, {
            $pull: { locations: locationId }
        });


        await location.deleteOne();


        return res.status(200).json({ message: "Location deleted successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};
