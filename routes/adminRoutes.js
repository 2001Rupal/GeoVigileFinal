const express = require("express");
const router = express.Router();

const {User, Student } = require("../models/User");


const { ensureAuthenticated, ensureAdmin, ensureSuperAdmin } = require("../middleware/auth");



// show pending students to admin/ superadimn-------------------------------

router.get("/pending-students",ensureAdmin, async (req, res) => {


    try {
        const students = await Student.find({ status: "Pending" });
        console.log("Fetched students:", students); //-------------


        res.render("pending-students", { students });
    } 
    catch (error) {


        console.error("Error fetching pending students:", error);
        res.status(500).send("Server Error");
    }
});

// Approve student-----------------------------------------------------------

router.post("/approve-student/:id", ensureAdmin, async (req, res) => {
    try {


        await Student.findByIdAndUpdate(req.params.id, { status: "Approved" });

        res.redirect("/admin/pending-students");
    } catch (error) {

        console.error( error);

        res.status(500).send("Server Error");
    }
});


// Reject student----------------------------------------------------------
router.post("/reject-student/:id", ensureAdmin, async (req, res) => {
    try {


        await Student.findByIdAndUpdate(req.params.id, { status: "Rejected" });
        res.redirect("/admin/pending-students");

    } catch (error) {
        console.error("Error rejecting student:", error);

        res.status(500).send("Server Error");

    }
});


// Admin Dashboard - manage Users-----------------------------------------

router.get("/manage-users", ensureAuthenticated, async (req, res) => {
    if (req.user.role !== "admin" && req.user.role !== "superadmin") {
        req.flash("error_msg", "Unauthorized access");
        return res.redirect("/dashboard");

        // req.flash("error_msg", " access denied");
        // return res.redirect("/dashboard1");
    }
    try {
        console.log("Current User in Backend:", req.user); 

        const users = await User.find();
        res.render("manage-users", { users, currentUser: req.user });


    } catch (err) {
        console.error(err);
        res.redirect("/dashboard");
    }
});

//-------------- Upgrade  to Admin (by Super Admin)------------------
router.post("/upgrade-user/:id", ensureAuthenticated, async (req, res) => {


    if (req.user.role !== "superadmin") {
        req.flash("error_msg", "Unauthorized action.");

        return res.redirect("/admin/manage-users");
    }

    try {
        await User.findByIdAndUpdate(req.params.id, { role: "admin" });


        req.flash("success_msg", "User upgraded to Admin successfully");
        res.redirect("/admin/manage-users");
    } catch (err) {


        console.error(err);
        req.flash("error_msg", "Error upgrading user");

        res.redirect("/admin/manage-users");
    }
});

// Delete User (Only Super Admin)----------------
router.post("/delete-user/:id", ensureAuthenticated, async (req, res) => {


    if (req.user.role !== "superadmin") {

        req.flash("error_msg", "Unauthorized action.");

        return res.redirect("/admin/manage-users");
    }

    try {
        await User.findByIdAndDelete(req.params.id);


        req.flash("success_msg", "User deleted successfully");
        res.redirect("/admin/manage-users");


    } catch (err) {
        console.error(err);
        req.flash("error_msg", "Error deleting user");


        res.redirect("/admin/manage-users");
    }
});

// demote Admin to User (Only Super Admin )------------------
router.post("/demote-user/:id", ensureAuthenticated, async (req, res) => {

    if (req.user.role !== "superadmin") {


        req.flash("error_msg", "Unauthorized action.");


        return res.redirect("/admin/manage-users");
    }

    try {
        const user = await User.findById(req.params.id);
        if (user && user.role === "admin") {


            user.role = "user"; //  convert to regular user
            await user.save();
            req.flash("success_msg", "Admin demoted to User !");
        }
        res.redirect("/admin/manage-users");
    } catch (err) {


        console.error(err);
        req.flash("error_msg", "error demoting Admin.");

        res.redirect("/admin/manage-users");
    }
});

module.exports = router;
