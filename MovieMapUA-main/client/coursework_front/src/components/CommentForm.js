
import React, { useState, useContext } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContext";

const CommentForm = ({ movieId, onNewComment }) => {
    const [text, setText] = useState("");
    const { user } = useContext(UserContext);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) {
            alert("Тільки залоговані користувачі можуть додавати коментарі.");
            return;
        }
        try {
            const res = await axios.post(`/api/comments/`, { movie: movieId, text, user: user._id });
            setText("");
            onNewComment(res.data.comment);
        } catch (error) {
            console.error("Error creating comment:", error);
        }
    };

    return (
        <div style={{display: "grid"}}>
        <form style={{
            display: "flex",
            justifyContent: "space-between"}} onSubmit={handleSubmit}>
            <textarea
                className="comment-input"
                style={{height: "60px"}}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ваш коментар..."
                required
            />
            <button className="button" type="submit">Надіслати</button>
        </form>
</div>
    );
};

export default CommentForm;
