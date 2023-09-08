const fs = require('fs');
const nunjucks = require('nunjucks');
const sendMailFromServer = require('../gmail');

const hello = fs.readFileSync('./templates/hello.html').toString();
let subscribers = fs.readFileSync('./DATA.txt', 'utf-8').split('\n').filter(email => email.trim() !== '');

const sendMail = async (req, res) => {
    const html = nunjucks.renderString(hello, {
        name: 'John Doe',
    });

    const options = {
        from: `Warby Parker Eyeglasses <${process.env.EMAIL}>`,
        replyTo: process.env.EMAIL,
        subject: 'Hello Test',
        text: 'Try-on glasses at home! Try 5 pairs for free from Warby Parker',
        html: html,
        textEncoding: 'base64',
        headers: [
            { key: 'X-Application-Developer', value: 'Been Helpful' },
            { key: 'X-Application-Version', value: 'v1.0.0' },
        ],
    };

    try {
        const sentEmails = [];

        for (const to of subscribers) {
            options.to = to.trim();

            try {
                const messageId = await sendMailFromServer(options);
                sentEmails.push({ to: options.to, messageId });
            } catch (error) {
                // Handle email sending errors here, if necessary
                console.error(`Error sending email to ${options.to}: ${error.message}`);
                // You can choose to log or handle the error as needed
            }

            // Remove the email address from the 'subscribers' array
            subscribers = subscribers.filter(email => email.trim() !== options.to);

            // Update the 'DATA.txt' file with the remaining email addresses
            fs.writeFileSync('./DATA.txt', subscribers.join('\n'));
            
            // Append the sent email information to 'OUTPUT.txt'
            fs.appendFileSync('./OUTPUT.txt', `To: ${options.to}, Message ID: ${messageId}\n`);

            // Delay between consecutive emails (e.g., 5 seconds)
            const delayInSeconds = 5;
            await new Promise(resolve => setTimeout(resolve, delayInSeconds * 1000));
        }

        res.status(200).json({
            message: 'Emails sent',
            sentEmails: sentEmails,
        });

    } catch (error) {
        res.status(500).json({
            message: 'Error sending emails',
            error: error,
        });
    }
};

module.exports = sendMail;