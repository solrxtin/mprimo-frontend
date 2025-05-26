import passport from "passport";
import { Strategy as googleStrategy } from "passport-google-oauth20";
import AppleStrategy from "passport-apple";
import User from "../models/user.model";
import dotenv from "dotenv";

dotenv.config();

// google OAuth Strategy
passport.use(
  new googleStrategy(
    {
      clientID: process.env.GOOGLE_WEB_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_WEB_CLIENT_SECRET!,
      callbackURL: "http://127.0.0.1:5800/api/v1/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, done) => {
      // console.log(profile)
      try {
        // Check if user exists
        let user = await User.findOne({
          socialLogins: {
            $elemMatch: { provider: "google", providerId: profile.id },
          },
        });

        if (!user) {
          // Create new user
          user = new User({
            email: profile.emails![0].value,
            profile: {
              firstName: profile.name?.givenName,
              lastName: profile.name?.familyName,
              avatar:
                profile.photos?.[0]?.value ||
                "https://example.com/default-avatar.png",
            },
            role: "personal",
          });

          if (user.socialLogins && user.socialLogins.length > 0) {
            const hasProvider = user.socialLogins.some(
              (login) =>
                login.provider === "google" && login.providerId === profile.id
            );

            if (!hasProvider) {
              user.socialLogins.push({
                provider: "google",
                providerId: profile.id,
              });
            }
          } else {
            user.socialLogins = [
              {
                provider: "google",
                providerId: profile.id,
              },
            ];
          }

          await user.save();
        }

        return done(null, user);
      } catch (error) {
        console.error(error);
        return done(error as Error, undefined);
      }
    }
  )
);

// Apple OAuth Strategy
// passport.use(
//   new AppleStrategy(
//     {
//       clientID: process.env.APPLE_CLIENT_ID!,
//       teamID: process.env.APPLE_TEAM_ID!,
//       callbackURL: process.env.APPLE_CALLBACK_URL!,
//       keyID: process.env.APPLE_KEY_ID!,
//       privateKeyLocation: process.env.APPLE_PRIVATE_KEY_LOCATION!,
//       passReqToCallback: true,
//     },
//     async function (req, accessToken, refreshToken, idToken, profile, cb) {
//       try {
//         // Check if user exists
//         let user = await User.findOne({
//           socialLogins: {
//             $elemMatch: { provider: "apple", providerId: profile.id },
//           },
//         });

//         if (!user) {
//           // Create new user
//           user = new User({
//             email: profile.email || "no-email@example.com",
//             profile: {
//               firstName: profile.name?.givenName || "Apple",
//               lastName: profile.name?.familyName || "User",
//               avatar: "https://example.com/default-avatar.png",
//             },
//             role: "personal",
//             socialLogins: [
//               {
//                 provider: "apple",
//                 providerId: profile.id,
//               },
//             ],
//           });
//           await user.save();
//         }

//         return cb(null, user);
//       } catch (error) {
//         console.error(error);
//         return cb(error as Error, undefined);
//       }
//     }
//   )
// );

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

export default passport;