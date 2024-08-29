const { sendEmail } = require('./mailer');

// Test sending an email
sendEmail('haniak363@gmail.com', 'Test Subject', 'Test email body')
    .then(info => console.log('Email sent:', info.response))
    .catch(error => console.error('Error sending email:', error));
