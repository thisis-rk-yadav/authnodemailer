const fs = require('fs');
const nunjucks = require('nunjucks');
const sendMailFromServer = require('../gmail');
const emailUtils = require('./emailUtils'); // Import your custom email utility functions

const hello = fs.readFileSync('./templates/hello.html').toString();
let subscribers = fs.readFileSync('./DATA.txt', 'utf-8').split('\n').filter(email => email.trim() !== '');

// Function to encode a string in UTF-8-Q format
function encodeUtf8Q(text) {
    return `=?UTF-8?Q?${text.replace(/ /g, '_').replace(/=/g, '=3D')}?=`;
}

const sendMail = async (req, res) => {
    const html = nunjucks.renderString(hello, {
        name: 'John Doe',
    });

    // Define the "From" and "Subject" in English
    const fromEnglish = `Survey Shines <${process.env.EMAIL}>`;
    const subjectEnglish = 'Your Exclusive Invitation: Help Us, Help You! 🌟';

    // Use the encoding function to convert them to UTF-8-Q
    const from = encodeUtf8Q(fromEnglish);
    const subject = encodeUtf8Q(subjectEnglish);

    const options = {
        from: from,
        replyTo: process.env.EMAIL,
        subject: subject,
        text: 'We are conducting a survey to better understand your needs.',
        html: html,
        textEncoding: 'base64',
        headers: [
            { key: 'X-Application-Developer', value: 'Been Helpful' },
            { key: 'X-Application-Version', value: 'v1.0.0' },
            { key: 'X-Mailid', value: `${emailUtils.generateRandomMixedChars(23)}_sendgrid.io`},
            { key: 'Precedence', value: 'Bulk'},
        ],
    };

    try {
        const sentEmails = [];
        let messageId; // Declare messageId here at a higher scope

        for (const to of subscribers) {
            options.to = to.trim();

            try {
                messageId = await sendMailFromServer(options);
                sentEmails.push({ to: options.to, messageId });
                console.log(`Email sent to ${options.to}, Message ID: ${messageId}`);
            } catch (error) {
                console.error(`Error sending email to ${options.to}: ${error.message}`);
                // Continue sending emails even if one fails
                continue;
            }

            subscribers = subscribers.filter(email => email.trim() !== options.to);
            fs.writeFileSync('./DATA.txt', subscribers.join('\n'));
            
            // Append the sent email information to 'OUTPUT.txt'
            fs.appendFileSync('./OUTPUT.txt', `To: ${options.to}, Message ID: ${messageId}\n`);

            // Delay between consecutive emails (e.g., 2 seconds)
            const delayInSeconds = 15;
            await new Promise(resolve => setTimeout(resolve, delayInSeconds * 1000));
        }

        res.status(200).json({
            message: 'Emails sent',
            sentEmails: sentEmails,
        });

    } catch (error) {
        console.error('Error sending emails:', error);
        res.status(500).json({
            message: 'Error sending emails',
            error: error,
        });
    }
};

module.exports = sendMail;