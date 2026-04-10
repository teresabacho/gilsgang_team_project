import React, { useState } from 'react';
import axios from 'axios';
import '../styles/header.css';
import '../styles/contact.css';
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function ContactPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('api/contact', { email, message });
            setStatus(response.data);
        } catch (error) {
            setStatus('Error: ' + error.response.data);
        }
    };

    return (
        <div>
            <Header />
            <div className="contact-container">
                <div className="contact-text">
                    <p>Зв'яжіться з нами!</p>
                </div>
                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="field-input">
                  <div className="text-email"><p>Електронна пошта</p></div>
                        <input
                            type="email"
                            className="email"
                            placeholder="Пошта"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <div className="comment"><p>Ваше повідомлення</p></div>
                        <textarea
                            className="comment-input"
                            placeholder="Ваші коментарі, пропозиції, побажання..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            required
                        />
                        <button type="submit" className="send"><p>Надіслати</p></button>
                    </div>
                </form>
                {status && <div className="status">{status}</div>}
            </div>
            <Footer />
        </div>
    );
}
