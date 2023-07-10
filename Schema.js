const mongoose = require("mongoose");
const { Schema } = mongoose;

//User Scheme
const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    userRoomId: { type: String },
    code: { type: String }
  });
  
  const userModel = mongoose.model("userModel", userSchema);

  
  //Room Schema
  const roomSchema = new Schema({
    userName: { type: String, required: true },
    userRoomId: { type: String, required: true }
  })

  const userRoomModel = mongoose.model("userRoomModel", roomSchema)

  module.exports = {userModel, userRoomModel}