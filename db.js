const mongoose = require('mongoose');

//mongodb uri
const MONGO_URI = "mongodb+srv://useruserov0634:WWdwSLOadLf0N4q8@cluster0.opbz4.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0/test";

//connect to db
const connectDb = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Mongoose connected to MONGODB Atlas');
  } catch (err) {
    console.log(err.message);
    process.exit(1);
  }
};

module.exports = connectDb;