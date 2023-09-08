const nodemailer = require('nodemailer');
const GOOGLE_KEY = require('../key.json');

const transport = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL,
        serviceClient: GOOGLE_KEY.client_id,
        privateKey: GOOGLE_KEY.private_key,
    }
});

module.exports = () => {
    return transport;
}