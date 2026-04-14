const express = require('express');
const { newLocation, getLocationById, getLocationsByMovieId, updateLocation, deleteLocation,} = require("../controllers/location");
const router = express.Router();

router.get("/:id", getLocationById);
router.get("/movie/:movieId", getLocationsByMovieId);
router.post("/", newLocation);
router.put('/:id', updateLocation);
router.delete('/:id', deleteLocation);
module.exports = router;
