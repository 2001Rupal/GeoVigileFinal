const express=require("express");
const router=express.Router();
const {GeoFence,Student,EntryExitLog }=require("../models/User");
const {ensureAuthenticated,ensureAdmin}=require("../middleware/auth");
const sendEmail = require("../utils/sendEmail"); 
const { v4: uuidv4 } = require("uuid"); 



router.post("/create",ensureAuthenticated,ensureAdmin, async(req,res)=>{
    try{
        const{name,latitude,longitude,radius,createdBy}=req.body;

        if (!name || !latitude || !longitude || !radius ) {
            return res.status(400).json({ error: "All fields are required!" });
        }
        const geofenceId = "geo-" + uuidv4();
        const newGeoFence=new GeoFence({

            geofenceId,name,latitude,longitude,radius,
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
        const eventTime = new Date();
        const today = new Date().toISOString().split("T")[0];
       
        console.log(`📌 Previous Status: ${student.lastKnownStatus}, Current Status: ${currentStatus}`);


        if (student.lastKnownStatus !== currentStatus) {
            const statusMsg = currentStatus === "Inside" ? "ENTERED" : "EXITED";


        // ✅ ENTRY CASE
        if (currentStatus === "Inside") {
            await EntryExitLog.updateOne(
                { studentId: student._id, date: today },
                {
                    $push: {
                        sessions: {
                            entryTime: eventTime
                        }
                    }
                },
                { upsert: true }
            );
            const entryMsg = `Your child ${student.name} has ENTERED the school zone at ${eventTime.toLocaleString()}.`;

             try {
                    await sendEmail(student.email, "GeoVigile Alert: Entry", entryMsg);
                    console.log("✅ Entry alert email sent to", student.email);
                } catch (err) {
                    console.error("❌ Failed to send entry email:", err);
                }

        // ✅ EXIT CASE
        }else if (currentStatus === "Outside") {

            const log = await EntryExitLog.findOne({ studentId: student._id, date: today });

            if (log && log.sessions.length > 0) {
                const lastSession = log.sessions[log.sessions.length - 1];

                if (!lastSession.exitTime) {
                        lastSession.exitTime = eventTime;

                        const durationMs = eventTime - new Date(lastSession.entryTime);
                        const minutes = Math.floor((durationMs / 1000 / 60) % 60);
                        const hours = Math.floor(durationMs / 1000 / 60 / 60);
                        const spentTimeStr = `${hours}h ${minutes}m`;

                        lastSession.spentTime = spentTimeStr;
                        await log.save();

                        const summaryMsg = `Hello ${student.name},

                    📅 Date: ${today}
                    🕒 Entry Time: ${ new Date(lastSession.entryTime).toLocaleString()}
                    🕕 Exit Time: ${eventTime.toLocaleString()}
                    ⏱️ Time Spent: ${spentTimeStr}

                    Thank you,  
                    Team GeoVigile
                                        `;

                                        

                                        try {
                                            await sendEmail(student.email, "GeoVigile: Exit Summary", summaryMsg);
                                            console.log("📨 Exit summary email sent to", student.email);
                                        } catch (err) {
                                            console.error("❌ Failed to send exit email:", err);
                                        }
                
                                        console.log("🕒 Entry:", lastSession.entryTime);
                                        console.log("🕕 Exit:", eventTime);
                
                        } else {
                            console.log("⚠️ Last session already has an exitTime.");
                        }

                    }
                 } else {
                    console.log("⚠️ No entry log found for today.");
                }

                      // Update student's last known status
            student.lastKnownStatus = currentStatus;
            await student.save();

        } else {
            console.log(" No status change for", student.name);
        }

        

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