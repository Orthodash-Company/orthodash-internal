import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "orthodash-secret-key-2025",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      // Simple hardcoded check for the specified credentials
      if (username === "orthodash@teamorthodontics.com" && password === "OrthoDash2025!") {
        // Return a mock user object
        const user: SelectUser = {
          id: 1,
          username: "orthodash@teamorthodontics.com",
          password: await hashPassword("OrthoDash2025!") // This won't be exposed to client
        };
        return done(null, user);
      } else {
        return done(null, false);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    // Return the mock user for the hardcoded credentials
    if (id === 1) {
      const user: SelectUser = {
        id: 1,
        username: "orthodash@teamorthodontics.com",
        password: await hashPassword("OrthoDash2025!")
      };
      done(null, user);
    } else {
      done(null, null);
    }
  });

  app.post("/api/register", async (req, res) => {
    const { username } = req.body;
    
    // Check if email ends with teamorthodontics.com
    if (!username?.endsWith("@teamorthodontics.com")) {
      return res.status(400).json({ error: "Only teamorthodontics.com email addresses are allowed" });
    }

    // For now, only allow the specific hardcoded user
    if (username !== "orthodash@teamorthodontics.com") {
      return res.status(400).json({ error: "Username not authorized" });
    }

    // Return error as this user should login instead
    return res.status(400).json({ error: "User already exists. Please login instead." });
  });

  app.post("/api/login", (req, res, next) => {
    const { username } = req.body;
    
    // Check if email ends with teamorthodontics.com
    if (!username?.endsWith("@teamorthodontics.com")) {
      return res.status(400).json({ error: "Only teamorthodontics.com email addresses are allowed" });
    }

    passport.authenticate("local", (err: any, user: any) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ error: "Invalid credentials" });
      
      req.login(user, (err) => {
        if (err) return next(err);
        // Return user without password
        const { password, ...userWithoutPassword } = user;
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Return user without password
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}