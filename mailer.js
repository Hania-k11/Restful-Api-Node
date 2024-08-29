const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'haniaaa0987@gmail.com', // 
        pass: 'rkml ltdi fbap vdpf' // App password
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Function to send email
const sendEmail = (to, subject, text) => {
    const mailOptions = {
        from: 'haniak363@gmail.com',
        to: to,
        subject: subject,
        text: text
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
