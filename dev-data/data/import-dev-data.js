const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const Tour = require('../../models/tourModel');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
const localdb = process.env.DATABASE_LOCAL;

mongoose.connect(DB, {}).then(() => {
  console.log('DB connection is successful');
});

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('Data Successfully Loaded');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

const deletAllData = async () => {
  try {
    await Tour.deleteMany();
    console.log('Data Deleted Successfully ');
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deletAllData();
}
