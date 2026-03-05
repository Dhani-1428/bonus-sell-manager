# Express + MongoDB Google OAuth Implementation

This document contains the Express + MongoDB implementation for reference. 
**Note:** Your current project uses Next.js + MySQL, but this Express code can be used if you decide to create a separate Express backend.

## Installation

```bash
npm install passport passport-google-oauth20 express-session mongoose dotenv
npm install --save-dev @types/passport @types/passport-google-oauth20 @types/express-session
```

## File Structure

```
backend/
├── config/
│   └── passport.js
├── models/
│   └── User.js
├── routes/
│   └── auth.js
├── server.js
└── .env
```

## 1. Environment Variables (.env)

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Session
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

# MongoDB
MONGODB_URI=mongodb://localhost:27017/foodsell_manager

# Server
PORT=5000
NODE_ENV=production
```

## 2. MongoDB User Model (models/User.js)

```javascript
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values but enforces uniqueness when present
  },
  avatar: {
    type: String,
    default: null,
  },
  password: {
    type: String,
    default: null, // Optional for Google OAuth users
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  subscriptionStatus: {
    type: String,
    enum: ['trial', 'active', 'expired', 'cancelled'],
    default: 'trial',
  },
  trialStartDate: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for faster queries
userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 });

module.exports = mongoose.model('User', userSchema);
```

## 3. Passport Configuration (config/passport.js)

```javascript
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

/**
 * Configure Google OAuth Strategy
 */
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: 'https://api.mydomain.com/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists by googleId
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update avatar if changed
          if (profile.photos && profile.photos[0] && user.avatar !== profile.photos[0].value) {
            user.avatar = profile.photos[0].value;
            await user.save();
          }
          return done(null, user);
        }

        // Check if user exists by email (link Google account to existing email account)
        user = await User.findOne({ email: profile.emails[0].value.toLowerCase() });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          if (profile.photos && profile.photos[0]) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value.toLowerCase(),
          googleId: profile.id,
          avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
          subscriptionStatus: 'trial',
          trialStartDate: new Date(),
        });

        return done(null, user);
      } catch (error) {
        console.error('Error in Google OAuth strategy:', error);
        return done(error, null);
      }
    }
  )
);

/**
 * Serialize user for session
 * Stores user ID in session
 */
passport.serializeUser((user, done) => {
  done(null, user._id);
});

/**
 * Deserialize user from session
 * Retrieves full user object from database using ID stored in session
 */
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error('Error deserializing user:', error);
    done(error, null);
  }
});

module.exports = passport;
```

## 4. Authentication Routes (routes/auth.js)

```javascript
const express = require('express');
const passport = require('passport');
const router = express.Router();

/**
 * GET /auth/google
 * Initiates Google OAuth flow
 * Redirects user to Google login page
 */
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    accessType: 'offline',
    prompt: 'consent',
  })
);

/**
 * GET /auth/google/callback
 * Handles Google OAuth callback
 * Authenticates user and redirects to frontend dashboard
 */
router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/auth/login?error=google_auth_failed',
    session: true,
  }),
  (req, res) => {
    // Successful authentication
    // Redirect to frontend dashboard
    const redirectUrl = req.query.redirect || '/dashboard';
    res.redirect(`${process.env.FRONTEND_URL || 'https://bonusfoodsellmanager.com'}${redirectUrl}`);
  }
);

/**
 * GET /auth/logout
 * Logout user and destroy session
 */
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Failed to logout' });
    }
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destroy error:', err);
        return res.status(500).json({ error: 'Failed to destroy session' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, message: 'Logged out successfully' });
    });
  });
});

module.exports = router;
```

## 5. Express Server Setup (server.js)

```javascript
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('./config/passport');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'lax',
    },
  })
);

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/auth', authRoutes);

/**
 * GET /profile
 * Protected route - only accessible if user is authenticated
 */
app.get('/profile', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }

  // Return user profile (without sensitive data)
  res.json({
    id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    avatar: req.user.avatar,
    subscriptionStatus: req.user.subscriptionStatus,
    trialStartDate: req.user.trialStartDate,
  });
});

/**
 * Middleware to check authentication
 * Can be used to protect any route
 */
const requireAuth = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized. Please log in.' });
};

// Example protected route
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
});
```

## Usage

1. **Start the server:**
   ```bash
   node server.js
   ```

2. **Initiate Google login:**
   ```
   GET http://localhost:5000/auth/google
   ```

3. **After Google authentication, user will be redirected to:**
   ```
   https://bonusfoodsellmanager.com/dashboard
   ```

4. **Access protected route:**
   ```
   GET http://localhost:5000/profile
   ```

## Testing

```bash
# Test Google OAuth flow
curl http://localhost:5000/auth/google

# Test protected route (requires authentication)
curl http://localhost:5000/profile
```

## Security Notes

1. **Session Secret:** Use a strong, random session secret in production
2. **HTTPS:** Always use HTTPS in production for secure cookie transmission
3. **CORS:** Configure CORS properly if frontend is on different domain
4. **Rate Limiting:** Add rate limiting to prevent abuse
5. **CSRF Protection:** Consider adding CSRF protection for state-changing operations
