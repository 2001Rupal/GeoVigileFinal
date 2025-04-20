const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const {User} = require("../models/User"); //---- User model

passport.use(
    new LocalStrategy({ usernameField: "email" }, async (email, password, done) => {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                return done(null, false, { message: "User not found" });
            }
            
            // Compare hashed passwords
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: "Incorrect password" });
            }

            return done(null, user) ;
        } catch (error) {
            return done(error);
        }
    })
);

// Serialize user
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});

module.exports = passport;
