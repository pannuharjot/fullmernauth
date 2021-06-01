const express = require('express');
require('dotenv').config({
    path: "./config.env"
});
const morgan = require('morgan')
const path = require('path')
const mongoose = require('mongoose');
const fs = require('fs')
const cors = require('cors');
const cookieParser = require('cookie-parser')
const fileUpload = require('express-fileupload')


const app = express();

const uuid = require('node-uuid')

morgan.token('id', function getId (req) {
  return req.id
})

const PORT = process.env.PORT || 5000;
const URI = process.env.MONGODB_URL;



morgan.token('id', function getId (req) {
    return req.id
  })
  app.use(function (req, res, next) {
    res.header("X-powered-by", "Blood, sweat, and tears Harjot Singh!!!")
    next()
  })
app.use(express.json());
app.use(cors())
app.use(cookieParser());
app.use(fileUpload({useTempFiles:true}));
app.use(assignId)

// log only 4xx and 5xx responses to console
app.use(morgan('dev', {
    skip: function (req, res) { return res.statusCode < 399 }
  }))
   
  // log all requests to access.log
  app.use(morgan('common', {
    stream: fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
  }))

// Routes
app.use('/user', require('./routes/userRouter'));
app.use('/api', require('./routes/upload'));
// Connect to mongo DB
mongoose.connect(URI, {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
}, err => {
    if(err) throw err
    console.log("connected to mongodb")
})


function assignId (req, res, next) {
    req.id = uuid.v4()
    next()
  }


app.listen(PORT, () => {
    console.log(`App is running on PORT: ${PORT}`)
});

