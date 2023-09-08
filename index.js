const express = require('express');
require('dotenv').config();
const pino = require('pino');
const expressPino = require('express-pino-logger');
const logger = pino({
    transport: {
        target: 'pino-pretty',
    },
    level: 'error',
});
const expressLogger = expressPino({ logger });

const app = express();

const mailer = require('./routes/mailer');

app.use(express.json());

app.use(expressLogger);

app.use('/mailer', mailer);

app.listen(3000, () => {
    logger.info('Server listening on port 3000');
});