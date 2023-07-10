const { mongoose } = require("mongoose");
require("dotenv").config();

//Database Connection
const databaseConnection =  async ()=>  {
    await mongoose.connect(
      `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@livecode.yutntla.mongodb.net/liveCode`
    );
    console.log("db Connected");
  }

  module.exports = databaseConnection; 