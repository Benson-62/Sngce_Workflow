const mongoose = require("mongoose");
require('dotenv').config();
const mongourl = process.env.mongo_url;
mongoose
  .connect(mongourl)
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((error) => {
    console.log(error);
  });