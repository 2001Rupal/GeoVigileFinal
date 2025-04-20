const express=require('express');
const engine = require('ejs-mate');

const mongoose = require("mongoose");
const authRoutes = require("./routes/authRoutes");
const bodyParser = require("body-parser");

const session = require("express-session");

// const mongoose = require("mongoose");
// const authRoutes = require("./routes/authRoutes");
// const bodyParser = require("body-parser");

// const session = require("express-session");

const flash = require("connect-flash");

const passport = require("./config/auth");

const path=require('path');
const cors = require("cors");


const adminRoutes = require('./routes/adminRoutes');
// const {User,Student} = require("./models/User"); //  Student model

const geoRoutes = require("./routes/geoRoutes");




const app=express();
app.use(express.json());


//middleware
app.use(express.static(path.join(__dirname,'public')));
app.use(express.urlencoded({extended:true}));




app.engine('ejs', engine);

app.set('view engine', 'ejs'); 

app.set('views', path.join(__dirname, 'views')); 

// Connect  MongoDB+
mongoose.connect("mongodb://127.0.0.1:27017/geovigile", {

    useNewUrlParser: true,
    useUnifiedTopology: true

}).then(() => console.log("MongoDB Connected"))

  .catch(err => console.log(err));

// Session Setup
app.use(session({


    secret: "secretKey",

    resave: false,

    saveUninitialized: false
}));

// Passport Middlware
app.use(passport.initialize());

app.use(passport.session());
app.use(flash());
app.use(cors());




// Globl Messages
app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg");
    res.locals.error_msg = req.flash("error_msg");
    next();
});




app.use("/",authRoutes);
app.use('/admin', adminRoutes);
app.use("/geo", geoRoutes);




//server
const port=3000;

app.listen(3000, '0.0.0.0', ()=>{
    console.log(`Server running on port 3000`);
});