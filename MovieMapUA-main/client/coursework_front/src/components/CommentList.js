import React, { useEffect } from "react";
import axios from "axios";

const CommentList = ({ movieId, comments, setComments }) => {
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const res = await axios.get(`/api/comments/${movieId}`);
                const sortedComments = res.data.comments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setComments(sortedComments);
            } catch (error) {
                console.error("Error getting comments:", error);
            }
        };
        fetchComments();
    }, [movieId, setComments]);

    return (
        <div >
            <h2>Коментарі:</h2>
            {comments.map((comment) => (
                <div className="single-container" style={{display: "grid", gridTemplateColumns: "1fr auto",}} key={comment._id}>
                    <p style={{fontWeight: "bold", fontSize:"35px", margin: "5px"}}>{comment.user.username}</p>
                    <p style={{color: "rgb(128, 128, 128)"}}>{new Date(comment.createdAt).toLocaleString()}</p>
                    <p style={{ fontSize:"24px", margin: "5px"}}>{comment.text}</p>
                </div>
            ))}
        </div>
    );
};

export default CommentList;
