const express=require("express");
const router=express.Router();
const {GeoFence,Student}=require("../models/User");
const {ensureAuthenticated,ensureAdmin}=require("../middleware/auth");
const sendEmail = require("../utils/sendEmail"); 






router.post("/create",ensureAuthenticated,ensureAdmin, async(req,res)=>{
    try{
        const{name,latitude,longitude,radius,createdBy}=req.body;

        if (!name || !latitude || !longitude || !radius ) {
            return res.status(400).json({ error: "All fields are required!" });
        }
        const newGeoFence=new GeoFence({

            name,latitude,longitude,radius,
            createdBy:req.user._id

        });

        await newGeoFence.save();
         req.flash("success_msg", "GeoFence created successfully!");

        res.redirect("/dashboard");


    }catch(error)
    {
        console.error(error);
        // res.status(500).send("Server Error");
        res.status(500).json({ error: "Server Error" });

    }
});

// Get All GeoFences
router.get("/fences",ensureAuthenticated,ensureAdmin,async (req, res) => {
    try {
        const geoFences = await GeoFence.find();

        console.log("Fetched GeoFences:", geoFences); 

        if (!geoFences || geoFences.length === 0) {

            return res.status(404).json({ error: "No GeoFences found!" });
        }

        res.json({ geoFences });
    } catch (err) {
        console.error("Error---> ",err);

        res.status(500).send("Server Error");    }
});

// Check if User is Inside a Fence
router.post("/check-location", async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const geoFences = await GeoFence.find();


        let inGeoFence = false;
        geoFences.forEach(fence => {
            const distance = getDistance(latitude, longitude, fence.latitude, fence.longitude);


            if (distance <= fence.radius) {
                inGeoFence = true;
            }
        });

        res.json({ inGeoFence });
    } catch (error) {



        console.error("Error checking location:", error);
        res.status(500).send("Server Error");    }
});




router.post("/student-location",async (req,res)=>{
    console.log("post request hits");
    try {
    const { name,email, deviceId, latitude, longitude } = req.body;

    console.log("➡️ Data received:");
    console.log({ name, email, device_id, latitude, longitude });


    console.log("📍 Received Student Location:");
    console.log("Name:", name);
    console.log("Device ID:", deviceId);
    console.log("Latitude:", latitude);
    console.log("Longitude:", longitude);


    res.status(200).json({ message: "Location received successfully!" });
    } catch (err) {
        console.error(" Error receiving student location:", err);
        res.status(500).json({ error: "Server error" });
    }


});

router.post("/mobile-location-update",async (req,res)=>{
    console.log("post request hits via mobile");
    try{
        const{ name, email, deviceId, latitude, longitude } = req.body;

        const student = await Student.findOne({ deviceId });

        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }

        // Check if student is inside any geofence
        const fences = await GeoFence.find();
        let isInsideAnyFence  = false;


        fences.forEach(fence => {
            const dist = getDistance(latitude, longitude, fence.latitude, fence.longitude);
            if (dist <= fence.radius) {isInsideAnyFence  = true;}
        });

        const currentStatus = isInsideAnyFence ? "Inside" : "Outside";

        // 🧠 Only send email if status has changed
        if (student.lastKnownStatus !== currentStatus) {


            const eventTime = new Date().toLocaleString();


            const statusMsg = currentStatus === "Inside" ? "ENTERED" : "EXITED";
            const alertMsg = `Your child ${student.name} has ${statusMsg} the school zone at ${eventTime}.`;

            await sendEmail(student.email, `GeoVigile Alert: ${statusMsg}`, alertMsg);


            console.log("📨 Email alert sent to", student.email);

            // Update student's last status
            student.lastKnownStatus = currentStatus;


            await student.save();

        } else {
            console.log(" No status change for", student.name);
        }

       //--------------------------------------------------------------------
        

        // if (!student.isInsideFence && isNowInside) {


        //     console.log(` ENTRY: ${student.name} has ENTERED the geofence.`);

        // } else if (student.isInsideFence && !isNowInside) {

        //     console.log(` EXIT: ${student.name} has EXITED the geofence.`);


        // } else {

        //     console.log(` ${student.name} has no change in geofence status.`);
        // }
        
        // Update current status
        // student.isInsideFence = inside;




        // await student.save();

//-----------------------------------------------------------------------------
        // Just log the details for now
        console.log("📍 Student data received via Mobile:");
        console.log(`Name: ${student.name}`);
        console.log(`Email: ${student.email}`);

        console.log(`Device ID: ${student.deviceId}`);
        console.log(`Location: ${latitude}, ${longitude}`);
        console.log(`Time: ${new Date().toLocaleString()}`);


        res.status(200).json({ message: "Location received and student recognized." });

    } catch (error) {

        console.error(" Error processing location data:", error);


        res.status(500).json({ message: "Server error." });
    }
    
});




// Function to calculate distance



function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);

    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 

    
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters

   
}


module.exports=router;