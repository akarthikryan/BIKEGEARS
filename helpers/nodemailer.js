const nodemailer = require('nodemailer')
const sendMail = async (name, email, id, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: 'bikeaccessories161@gmail.com',
                pass: 'odod hudx pkfy txan'
            }
        })
        const mailOptions = {
            from: 'bikeaccessories161@gmail.com',
            to: email,
            subject: 'For email verification',
            html: '<p>Hi ' + name + ',This is from Bike Accessories Shop.<br> It is your OTP : ' + otp + '</p>'
        }
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
            }
            else {
                console.log('Email has been send ', info.response);
            }
        })
    } catch (error) {
        console.log(error);
    }
}


module.exports = sendMail