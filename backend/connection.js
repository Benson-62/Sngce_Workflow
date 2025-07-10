const mongoose = require("mongoose");
mongoose
  .connect('mongodb+srv://Adisankar:CB1E9r7mjPV5YLpq@cluster0.3nnx8jj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log("Connected to DB");
  })
  .catch((error) => {
    console.log(error);
  });