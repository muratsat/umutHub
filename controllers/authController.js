const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const User = require("../models/user.model");
const MyClass = require("../models/class.model");
const MySchool = require("../models/school.model");
const authMiddleware = require("../middlewares/authMiddleware");
const mongoose=require('mongoose');
const { sendOTPByEmail } = require("../middlewares/emailOtpMiddleware");
const otpGenerator  = require("../utils/otpGenerator");

//User Registration
exports.registerUser = async (req, res) => {
  // const{email, password } = req.body;
  const{email } = req.body;

  try {
    //check if user exists
    // const existingUser = await User.findOne({$or: [{email}]});
    // if (existingUser) {
    //   return res.status(400).json({message: "Username or Email already exists"});
    // }

    const user = await User.findOne({ email });
    //console.log(user);
    
    // Generate OTP
    const otp = otpGenerator.generateOTP();

    
    
    //hash password
    // const hashedPassword = await bcrypt.hash(password, 10);
    //new user object
    if (!user) {
      const newUser = new User({
        email,
        // password: hashedPassword,
        otp
      });
  
      //save
      await newUser.save();
    }
    if (user) {
    user.otp = otp;
    await user.save();
    }
    // Send OTP via Email
    sendOTPByEmail(email, otp);
    
    res.status(201).json({message: "Successfully, OTP sent to email"});   
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Server Error"});
  }
};


exports.registerDetail = async (req, res) => {
  const{name, surname, classId, schoolId } = req.body;
  try {

    if(!name || !surname || !classId || !schoolId){
      return res.status(404).json({message: "Убедитесь что все поля заполнены"});
    }


    var _id = new mongoose.Types.ObjectId(schoolId);

    const mySchool = await MySchool.findById({_id})
    if(!mySchool){
      return res.status(404).json({message: "Школа не найдена"});
    }
    
    _id = new mongoose.Types.ObjectId(classId);

    const myClass = await MyClass.findById({_id})
    if(!myClass){
      return res.status(404).json({message: "Класс не найден"});
    }

    
    //new user object
    const user = req.user;

    user.name=name;
    user.surname=surname;
    user.schoolId=schoolId;
    user.classId=classId;

    //save
    await user.save();
    res.status(201).json({message: "Регистрация прошла успешно"});   
  } catch (error) {
    console.error(error);
    res.status(500).json({message: "Server Error"});
  }
};


//Login User
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    //console.log(user);
    if (!user) {
      return res.send(404).json({message: "User not found"});
    }
    //compare password

    const isPasswordValid = await bcrypt.compare(password.trim(), user.password);

console.log(isPasswordValid);
    
    if (!isPasswordValid) {
      return res.status(401).json({message: "Invald Password"})
    }

    // Generate OTP
    const otp = otpGenerator.generateOTP();

    //save otp to database
    user.otp = otp;
    await user.save();

    // Send OTP via Email
    sendOTPByEmail(email, otp);

    res.status(200).json({message: "Please Enter Your OTP"});

    //const token = jwt.sign({userId: user._id}, 'secret', {expiresIn: '1h'});

    //res.status(200).json({token, user: {username: user.username, email: user.email}});
    
  } catch (err) {
    console.error(err.message);
    res.status(500).json({message: 'Server Error'})
  }
};

//Get Users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).send(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({message: 'Server Error'})
  }
}

//Remove Users
exports.removeUsers = async (req, res) => {
  const { username } = req.params;
  try {
    const deletedUser = await User.findOneAndDelete({ username });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User deleted successfully", user: deletedUser });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({message: 'Server Error'})
  }
}