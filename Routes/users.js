const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const router = express.Router()
const userModel = require('../Models/userModel')
const nodemailer = require('nodemailer')
const { validateEmail, validatePhone } = require('../utilities/validation')
const generateOtp = require('../utilities/generateOTP')
const authenticateToken = require('../Auth/auth')
require('dotenv').config()

router.use(express.json())

const MY_EMAIL = process.env.MY_EMAIL
const MY_EMAIL_PASSWORD = process.env.MY_EMAIL_PASSWORD

console.log(MY_EMAIL , MY_EMAIL_PASSWORD)

let otpStore={}
const transporter = nodemailer.createTransport({
  service : "Gmail",
  auth: {
    user: MY_EMAIL,
    pass: MY_EMAIL_PASSWORD
  },
  tls: { rejectUnauthorized: false }
})
//Get OTP
router.post('/get-otp', async (req, res) => {
  try {
    const { email, phone } = req.body;

    const existingEmail = await userModel.findOne({ email: email })
    const existingPhone = await userModel.findOne({ phone: phone })

    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' })
    }
    if (existingPhone) {
      return res.status(400).json({ message: 'Phone number already exists' })
    }

    //Generate OTP and send It to user
    const otp = generateOtp()
    otpStore[email] = otp;

    const mailOptions = {
      from: MY_EMAIL,
      to: email,
      subject: 'OTP Verification',
      text: `Your OTP is ${otp}`
    }

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log(error)
        return res.status(404).json({ message: "OTP can not sent" } , {MY_EMAIL , MY_EMAIL_PASSWORD})
      }
      console.log('Email sent: ' + info.response)
      return res.status(200).json({ message: "OTP sent to your Number" })
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
})

//Verify Otp and Sign In
router.post('/sign-in', async (req, res) => {
  try {
    const { email, otp, name, phone, password } = req.body;
    if (!name || !email || !phone || !password || !otp) {
      return res.status(404).json({ message: "All fields are required" })
    }

    const storedOtp = otpStore[email];
    if (!storedOtp || storedOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" })
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new userModel({
      name: name,
      email: email,
      phone: phone,
      password: hashedPassword,
    })
    await user.save()
    delete otpStore[email];

    return res.status(200).json({ message: 'Signed In Successfully' })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: 'Internal Server Error' })
  }
})

//Log In
router.post('/log-in', async (req, res) => {
  const { emailOrPhone, password } = req.body

  try {
    let user;
    if (validateEmail(emailOrPhone)) {
      user = await userModel.findOne({ email: emailOrPhone })
    } else if (validatePhone(emailOrPhone)) {
      user = await userModel.findOne({ phone: emailOrPhone })
    } else {
      return res.status(400).json({ message: "Email or Phone Number Does Not Exist , Please Sign In" })
    }

    if (!user) {
      return res.status(400).json({ message: "Email or Phone Number Does Not Exist , Please Sign In" })
    }

    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong Password" })
    }
    const authClaims = [{ user : user.id   }, { jti: jwt.sign({}, 'Iamrid150') }];
    const token = jwt.sign({ authClaims }, 'Iamrid150', { expiresIn: "1d" });
    res.status(200).json({ id: user._id, token: token })
  } catch (error) {
    console.log(error)
  }
});

//Add profilePic and bio
router.put('/update-profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.headers.id
    const { profilePic, bio } = req.body

    const user = await userModel.findById(userId)

    if (!user) {
      return res.status(404).json({ message: "User Not Found" })
    }

    if (profilePic) {
      user.profilePic = profilePic;
    }

    if (bio) {
      user.bio = bio;
    }

    await user.save();

    return res.status(200).json({ message: "Profile Updated Successfully" })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
})

//Get User Info
router.get('/user-info',authenticateToken ,  async (req, res) => { 
  try {
    const userId = req.headers.id
    const user = await userModel.findById(userId)
    if (!user) {
      return res.status(400).json({ message: "User Not Found" })
    }
    const userInfo = {
      id: user._id,
      profilePic: user.profilePic,
      name: user.name,
      bio: user.bio,
      email : user.email,
      phone : user.phone
    }
    return res.status(200).json({userInfo})
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
})

// Get Other users Info
router.get('/user-info-byId/:userId', authenticateToken, async (req, res) => {
  const { userId } = req.params;
  if(!userId){
    return res.status(404).json({message : "User Not Found"})
  }
  try {
    const user = await userModel.findById(userId)
    return res.status(200).json({user})
  } catch (error) {
    console.log(error)
    return res.status(200).json({message : "Internal Server Error"})
  }
})

//Get all user
router.get('/all-users', authenticateToken, async (req, res) => {
  try {
    const users = await userModel.find()
    return res.status(200).json({ users })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Internal Server Error" })
  }
})

//Search Users
router.get('/search-users', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ message: "Query is required" });
    }

    const users = await userModel.find({
      name: { $regex: `^${query}`, $options: 'i' }
    }).limit(10);  // Limit the results to 10 suggestions

    const suggestions = users.map(user => user.name);

    return res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Error in search-users route:', error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
});

//Get Searched user Info
router.get('/search-user-info', authenticateToken, async (req, res) => { 
  try {
    const { query } = req.query
    if (!query) { 
      return res.status(400).json({ message: "Query is required" });
    }

    const user = await userModel.findOne({
      name: { $regex: `^${query}`, $options: 'i' }
    });

    if (!user) {
      return res.status(404).json({ message: "User Not Found" });
    }

    const userInfo = {
      id: user._id,
    }
    return res.status(200).json({userInfo})
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
})

module.exports = router