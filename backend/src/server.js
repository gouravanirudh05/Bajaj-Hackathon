import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import authRoutes from './routes/auth.js';
import conversationRoutes from './routes/conversation.js';
import chatRoutes from './routes/chat.js';
import guestRoutes from './routes/guest.js';

import mainRoute from './routes/mainRoute.js'

dotenv.config();
const app = express();
const port = process.env.PORT || 5001;

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

const corsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: false,
};
app.use(cors(corsOptions));
app.use(express.json());

const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-assistant";
// console.log(mongoURI)
mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/chat/auth", chatRoutes);
app.use("/api/chat/guest", guestRoutes);
import devRoutes from './routes/devRoutes.js';
app.use('/api/dev', devRoutes);
app.use('/hackrx/run', mainRoute)
app.get("/", (req, res) => {
  res.send("API is running ");
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });


export default app;
