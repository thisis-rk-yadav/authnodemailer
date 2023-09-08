const express = require('express');
const sendMail = require('../controllers/mailer');
const router = express.Router();

router.post('/send', sendMail);

module.exports = router;