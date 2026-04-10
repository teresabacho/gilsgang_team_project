const bcrypt = require('bcryptjs');
const User = require('../models/User');
const jwt = require("jsonwebtoken");



const bcryptSalt = bcrypt.genSaltSync(10);

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const userDoc = await User.create({
            username,
            email,
            password: bcrypt.hashSync(password, bcryptSalt),
        });

        res.json(userDoc);
    } catch (e) {
        res.status(422).json(e);
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    const userDoc = await User.findOne({ email });

    if (userDoc) {
        const passOk = bcrypt.compareSync(password, userDoc.password);
        if (passOk) {
            jwt.sign({ email: userDoc.email, id: userDoc._id }, process.env.JWT, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token, {
                    httpOnly: true,
                }).json(userDoc);
            });

        } else {
            return res.status(400).json({ error: "Неправильний пароль або електронна пошта!" });

        }
    } else {
        return res.status(404).json({ error: "Користувача не знайдено!" });
    }


};
exports.logout = (req, res) => {
    res.cookie('token', '').json({ message: 'Logged out successfully' });

};