import React from "react";
import '../styles/movieitem.css';
import {Link} from "react-router-dom";

const MovieItem = ({ title, year, posterUrl, director, genre, id }) => {

    return (


        <Link className="link" to={`/movie/${id}`}>
            <div className="container">

                <img src={posterUrl} alt={title} className="image"/>

                <div className="info">
                    <h1 className="title">{title}</h1>
                    <div className="infoItem">
                        <p className="label">Режисер:</p>
                        <p className="value">{director}</p>
                    </div>
                    <div className="infoItem">
                        <p className="label">Рік випуску:</p>
                        <p className="value">{year}</p>
                    </div>
                    <div className="infoItem">
                        <p className="label">Жанр:</p>
                        <p className="value">{genre}</p>
                    </div>
                </div>



        </div></Link>
    );
};

export default MovieItem;
