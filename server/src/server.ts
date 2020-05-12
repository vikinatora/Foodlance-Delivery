import bodyParser from "body-parser";
import express from "express";

import connectDB from "../config/database";
import auth from "./routes/api/auth";
import user from "./routes/api/user";
import order from "./routes/api/order";
import marker from "./routes/api/marker";

import cors from "cors";

const app = express();

// Connect to MongoDB
connectDB();

// Express configuration
app.set("port", process.env.PORT || 5000);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.options('*', cors())
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Auth-Token, Access-Control-Allow-Headers, Authorization, X-Requested-With");
  next();
});
app.get("/", (_req, res) => {
  res.send("API Running");
});
app.use("/api/auth", auth);
app.use("/api/user", user);
app.use("/api/order", order);
app.use("/api/marker", marker);


const port = app.get("port");
const server = app.listen(port, () =>
  console.log(`Server started on port ${port}`)
);

export default server;
