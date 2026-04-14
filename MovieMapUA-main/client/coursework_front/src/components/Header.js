import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {useContext} from "react";
import {UserContext} from "../context/UserContext";
const Header = () => {
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const searchRef = useRef(null);
    const navigate = useNavigate();
    const {user} = useContext(UserContext);
    const toggleSearch = () => {
        setShowSearch(!showSearch);
    };

    const handleClickOutside = (event) => {
        if (searchRef.current && !searchRef.current.contains(event.target)) {
            setShowSearch(false);
        }
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        if (searchQuery.trim()) {
            navigate(`/searchresult?title=${searchQuery}`);
            setShowSearch(false);
        }
    };

    useEffect(() => {
        if (showSearch) {
            document.addEventListener('mousedown', handleClickOutside);
        } else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showSearch]);

    return (
        <div>
            <header>
                <div className="h-top">
                    <Link className="header-link-logo" to={'/'}>
                        <h2>MovieMapUA</h2>
                    </Link>

                    <ol className="h-nav-menu">
                        <Link className="header-link" to={'/about'}>
                            <li>Про нас</li>
                        </Link>
                        <Link className="header-link" to={'/contact'}>
                            <li>Зворотний зв'язок</li>
                        </Link>
                        <Link className="header-link" to={'/movielist'}>
                            <li>Фільми</li>
                        </Link>
                    </ol>

                    <div className="icon">
                        <div className="icon-search" onClick={toggleSearch}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth={1.5}
                                stroke="currentColor"
                                className="w-6 h-6"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                                />
                            </svg>
                        </div>
                        {showSearch && (
                            <div className="search-bar" ref={searchRef}>
                                <form onSubmit={handleSearchSubmit}>
                                    <input
                                        type="text"
                                        placeholder="Введіть Ваш пошуковий запит..."
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                    />
                                </form>
                            </div>
                        )}
                        <div className="icon-login">
                            <Link to={user?'/profile':'/login'}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="#fff" className="w-4 h-4">
                                    <path
                                        fillRule="evenodd"
                                        d="M15 8A7 7 0 1 1 1 8a7 7 0 0 1 14 0Zm-5-2a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM8 9c-1.825 0-3.422.977-4.295 2.437A5.49 5.49 0 0 0 8 13.5a5.49 5.49 0 0 0 4.294-2.063A4.997 4.997 0 0 0 8 9Z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </header>
        </div>
    );
};

export default Header;