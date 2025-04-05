import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model";

// Passport serialization
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log(profile)
      try {
        // Check if user exists
        let user = await User.findOne({ 
            socialLogins: { 
              $elemMatch: { provider: 'Google', providerId: profile.id }
            }
        });
          
        if (!user) {
          // Create new user
          user = new User({
            email: profile.emails![0].value,
            profile: {
                firstName: profile.displayName,
                avatar: profile.photos![0].value,
            },
            role: "customer"
          });

          if (user.socialLogins && user.socialLogins.length > 0) {
            const hasProvider = user.socialLogins.some(
              login => login.provider === "Google" && login.providerId === profile.id
            );
            
            if (!hasProvider) {
              user.socialLogins.push({
                provider: "Google",
                providerId: profile.id,
              });
            }
          } else {
            user.socialLogins = [{
              provider: "Google",
              providerId: profile.id,
            }];
          }

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);
