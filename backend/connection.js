const mongoose = require("mongoose");
const mongourl = process.env.mongo_url;
mongoose
  .connect()
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((error) => {
    console.log(error);
  });