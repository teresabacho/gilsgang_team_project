require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');

const router = express.Router();

router.post('/', (req, res) => {
    const { email, message } = req.body;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });

    const mailOptions = {
        from: email,
        to: process.env.GMAIL_USER,
        subject: 'New Contact Form Submission',
        text: `From: ${email}\n\nMessage: ${message}`,
        replyTo: email
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send(error.toString());
        }
        res.status(200).send('Message sent: ' + info.response);
    });
});

module.exports = router;
