const express = require("express");
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require("bcrypt");

app.use(bodyParser.json());
app.use(cors());

//Database Connection
async function main() {
  await mongoose.connect(
    "mongodb+srv://mithuncy:01757@livecode.yutntla.mongodb.net/user"
  );
  console.log("db Connected");
}
main().catch((err) => console.log(err)); // Error log

//User Scheme
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  password: { type: String, required: true },
});

const userModel = mongoose.model("userModel", userSchema);

// app.get('/', (req, res)=>{
//     res.send('Hello world')
// })

app.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;

  let user = new userModel(); // Mongoogse Model
  user.name = name;
  user.email = email;
  user.password = password;

  try {
    // const regex = /^(?=.*[a-z])(?=.*[A-Z])[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    // const validEmail = regex.test(email)

    const checkUser = await userModel.findOne({ email: email });
    const checkUserName = await userModel.findOne({ name: name });

    if (!name || !email || !password) {
      return res.status(400).json("User Authentication Fail");
    }
    //Check user Email address
    else if (checkUser) {
      return res.status(302).json("User Already Exit");
    }
    //Check User Name
    else if (checkUserName) {
      return res.status(208).json("User Name Already Taken");
    } else {
      res.status(201).json("User Created Successfully");

    //Hash Password with Bcrtpt package
      const salt = await bcrypt.genSalt(10); //Salt Round 10
      const hash = await bcrypt.hash(user.password, salt);
      user.password = hash;

      user.save();
    }
  } catch (e) {
    console.log(e); //Error Log
    return res.status(500).json({ message: "Internal server error" });
  }
});


//Room Api

app.post('/room', async (req, res)=>{

  const {userName} = req.body;

  try{
    const checkUserName = await userModel.findOne({name: userName})

    if(!checkUserName){
      res.status(400).json("Invalid User Name")
    } else{
      res.status(200).json('ok')
      
    }
  }
  catch(e){
    console.log(e)
  };
})

// app.get('/room', async (req, res)=>{
//   const user = await userModel.findOne({name})
// })



io.on('connection', (socket) => {
  console.log('a user connected');
});


const port = 4000;
server.listen(port, () => {
  console.log(`server running ${port}`);
});
