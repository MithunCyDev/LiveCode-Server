const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const emailValidator = require("deep-email-validator");
const {userModel} = require('./Schema');


router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  let newUser = new userModel(); // Mongoogse Model
  newUser.name = name;
  newUser.email = email;
  newUser.password = password;

  try {
    const checkUser = await userModel.findOne({ email: email });
    const checkUserName = await userModel.findOne({ name: name });

    //Check Email with Deep Email Validator
    async function isEmailValid(email) {
      return emailValidator.validate(email);
    }
    const { valid } = await isEmailValid(email);

    if (!valid) {
      return res.status(400).json("Invalid email address");
    }

    //Check user Email address in Database
    else if (checkUser) {
      return res.status(302).json("User Already Exit");
    }
    //Check User Name in Database
    else if (checkUserName) {
      return res.status(208).json("User Name Already Taken");
    } else {
      res.status(201).json("User Created Successfully");

      //Hash Password with Bcrtpt package
      const salt = await bcrypt.genSalt(10); //Salt Round 10
      const hash = await bcrypt.hash(newUser.password, salt);
      newUser.password = hash;

      await newUser.save();
    }
  } catch (e) {
    console.log(e); //Error Log
    return res.status(500).json({ message: "Internal server error" });
  }
});

//Room Api
router.post("/room", async (req, res) => {
  const { userName, password } = req.body;

  try {
    //Find User In Database
    const User = await userModel.findOne({ name: userName });
  
    //Check User
    if(!User){
      res.status(400).json('Invalid credentials')
      return
    }
    //Check User Password
    else if(User){
      const isPasswordValid = await bcrypt.compare(password, User.password);
      if(!isPasswordValid){
        res.status(404).json('Invalid Password')
        return
      }
      else {
        res.status(200).json(User.name);
        return
      }
    }
    
  } catch (e) {
    console.log(e);
  }
});

module.exports = router;
