const nodemailer = require("nodemailer");

//Nodemailer
//transporter configuration
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: "2104.01038@manas.edu.kg",
    pass: "dulg ezgq vdpl pkrk",
  },
});

//Send OTP via Email
exports.sendOTPByEmail = async (email, otp) => {
  const mailOptions = {
    from: '"ProSoft" <' + process.env.email + '>',
    to: email,
    subject: "OTP Верификация",
    text: `Ваш код: ${otp}`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email: ", error);
    } else {
      console.log("Email sent: ", info.response);
    }
  });
};

//reference
//https://stackoverflow.com/questions/65983495/nodemailer-invalid-login-535-authentication-failed

