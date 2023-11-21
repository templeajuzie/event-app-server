const express = require("express");
require("dotenv").config();
const connectDb = require("./db/ConnectDb");
const eventRouter = require("./routes/eventRoutes");
const authRouter = require("./routes/authRoutes");
const bodyParser = require("body-parser");
const multer = require("multer");
const port = process.env.PORT || 5000;
const path = require("path");
const cors = require("cors");

const cookieParser = require("cookie-parser");

const app = express();

app.listen(port, (req, res) => {
    console.log(`Server listening to ${port} 🔥🔥`)
})

connectDb();


app.use(
  cors({
    cors: {
      origin: ["http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      allowedHeaders: ["Authorization", "Content-Type"],
      credentials: true,
    },
  })
);

app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);



app.use(express.json());
app.use(cookieParser());
// app.use(fileUpload({ useTempFiles: true }));

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // Multer error occurred
    console.log("error");
    res.status(400).send("Multer error: " + err.message);
  } else {
    // Handle other errors
    console.log("next");
    next(err);
  }
});

app.use("/api/v1/blog", eventRouter);
app.use("/api/v1/auth", authRouter);


app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
