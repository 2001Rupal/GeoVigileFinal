const express=require("express");
const router=express.Router();
const bcrypt= require("bcrypt");

const passport = require("passport");

const { ensureAuthenticated, ensureAdmin } = require("../middleware/auth");

const { User, Student } = require("../models/User");


// default

router.get('/', (req, res) => res.render('home',{ message: null }));


// show login Page
router.get("/login", (req, res) => {
    res.render("login", { error_msg: req.flash("error") });
});

// andle login
router.post("/login", (req, res, next) => {
    passport.authenticate("local", {
        successRedirect: "/dashboard", // redirect to dashboard on success
        failureRedirect: "/login",// on fail red. to login
        failureFlash: true
    })(req, res, next);
});



// Show Dashboard (Only Logged-in Users)
router.get("/dashboard", ensureAuthenticated, (req, res) => {
    res.render("dashboard", { user: req.user });
});

// Logout Route
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success_msg", "You are logged out");
        res.redirect("/login");
    });
});


router.get("/register", (req, res) => {
    res.render("register", { title: "Register" });
});

router.post("/register",async(req,res)=>{
    try{
        const{name, email,phone,address, type, role,password, confirmPassword}=req.body;

        if(password!==confirmPassword)
        {
            return res.status(400).send("passwords do not match");
        }

        const existingUser=await User.findOne({email});
        if(existingUser)
        {
            return res.status(400).send("email is already in use");
        }

        const hashedPassword=await bcrypt.hash(password,10);

        const newUser=new User({
            name,
            email,
            phone,


            address,
            type,

            role,
            password:hashedPassword,
        });

        await newUser.save();

        res.redirect("/login");

    }
    catch(error)
    {
        console.error(error);

        
        res.status(500).send("Server error");
    }
});


// show the form 
router.get("/student-form", (req, res) => {
    res.render("studentForm", { message: req.query.message || null });
});

// form submission
router.post("/register-student", async (req, res) => {

    try {
        console.log("Received Data:", req.body);
        const { name, email, phone, parentName, parentContact, deviceId, schoolName } = req.body;

        const newStudent = new Student({
            name,
            email,
            phone,
            parentName,
            parentContact,
            deviceId,
            schoolName
        });

        await newStudent.save();
        res.redirect("/student-form?message= Student registered successfully! Waiting for Admin Approval.");
         

    }
    catch (error) {
        console.error("Error:", error);
        // 
        //  error aaye to
        
        res.redirect("/student-form?message=  Registration failed. Please try again.");
        
    }
});



module.exports = router;