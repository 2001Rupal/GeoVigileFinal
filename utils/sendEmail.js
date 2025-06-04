
const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, message) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: 'geovigile.alerts@gmail.com', 
                pass: ''     // app password
            }
        });

        const mailOptions = {
            from: '"GeoVigile Alerts" <geovigile.alerts@gmail.com>',
            to,
            subject,
            html: `<p>${message}</p>`
        };
       


        const info = await transporter.sendMail(mailOptions);
        console.log(" Email sent:", info.messageId);
    } catch (error) {
        console.error(" Error sending email:", error);
    }
};

module.exports = sendEmail;
