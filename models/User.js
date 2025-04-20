const mongoose = require("mongoose");


const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    type: { type: String, required: true }, // school, college.
    role: { type: String, enum: ["admin", "user","superadmin"], default: "user" }, 

    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

// student Schema
const StudentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    parentName: { type: String, required: true, trim: true },
    parentContact: { type: String, required: true, trim: true },
    deviceId: { type: String, required: true, unique: true, trim: true }, // Unique Device ID
    schoolName: { type: String, required: true, trim: true },
    status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" }, // Admin approval status
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Reference to the Admin managing the student
    isInsideFence: { type: Boolean, default: false },
    lastKnownStatus: { type: String, enum: ["Inside", "Outside"], default: "Outside" },

    createdAt: { type: Date, default: Date.now }
});


const GeoFenceSchema=new mongoose.Schema({
    name:String,
    latitude:Number,
    longitude:Number,
    radius:Number,
    createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User"},
    createdAt:{type:Date,default:Date.now}

});

const User = mongoose.model("User", UserSchema);
const Student = mongoose.model("Student", StudentSchema);
const GeoFence= mongoose.model("GeoFence",GeoFenceSchema);


module.exports={User,Student,GeoFence};

