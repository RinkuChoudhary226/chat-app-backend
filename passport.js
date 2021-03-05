const passport = require('passport');
const passportJWT = require("passport-jwt");
const JWTStrategy   = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const bcrypt = require("bcrypt");
const userModel = require('./models/user.model');
passport.use(new JWTStrategy({
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey   : process.env.JWT_SECRET
},
function (jwtPayload, cb) {
    //find the user in db if needed. This functionality may be omitted if you store everything you'll need in JWT payload.
    return userModel.findOne({
            _id:jwtPayload._id,
            isBlock:false,
        })
        .then(user => {
            if(user){
                return cb(null, user);
            }
            return cb('Unauth');
        })
        .catch(err => {
            return cb(err);
        });
}
));
passport.serializeUser(function(user, done) {
    done(null, user);
});
  
passport.deserializeUser(function(user, done) {
    done(null, user);
});
const LocalStrategy = require('passport-local').Strategy;
passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, 
    function (email, password, cb) {
        //this one is typically a DB call. Assume that the returned user object is pre-formatted and ready for storing in JWT
        return userModel.findOne({email})
           .then(async user => {
               if (!user) {
                   return cb(null, false, {message: 'Username & Password are incorrect'});
               }
               let match = await bcrypt.compare(password,user.password);
               // check password
               if ( match ){
                    return cb(null, user, {message: 'Logged In Successfully'});
               }
               return cb(null, false, {message: 'Username & Password are incorrect'});
          })
          .catch(err => cb(err));
    }
));
