import React from 'react';
import {Link} from "react-router-dom";

const AuthModal = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div className="auth-modal-overlay" onClick={handleOverlayClick}>
            <div className="auth-modal">
                <div className="auth-modal-header">
                    <h3>Необхідна реєстрація</h3>
                    <button
                        className="auth-modal-close"
                        onClick={onClose}
                        aria-label="Закрити"
                    >
                        ×
                    </button>
                </div>

                <div className="auth-modal-content">
                    <p>
                        Щоб додавати маршрути в обране, вам потрібно увійти в свій акаунт або зареєструватись.
                    </p>

                    <div className="button">
                        <Link to={'/signup'}>Зареєструйтесь</Link>
                    </div>
                        <div className="auth-modal-divider">
                            <span>Вже маєте профіль?</span>
                        </div>
                    <div className="button">
                        <Link  to={'/login'}>Увійти</Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AuthModal;