const mongoose = require('mongoose');
const AppSize = require('./models/app_size.model');
const BusinessType = require('./models/business_type.model');
const AgeRange = require('./models/age_range.model');
// MongoDB URI
const MONGO_URI = 'mongodb://localhost:27017/db_appverif';

// Seed Data


const appSizeData = [
  { label: '0-100 Mo', value: '0-100' },
  { label: '101-200 Mo', value: '101-200' },
  { label: '201-300 Mo', value: '201-300' },
  { label: '301-400 Mo', value: '301-400' },
  { label: '401-500 Mo', value: '401-500' },
  { label: '501-600 Mo', value: '501-600' },
  { label: '601-700 Mo', value: '601-700' },
  { label: '701-800 Mo', value: '701-800' },
  { label: '801-900 Mo', value: '801-900' },
  { label: '901-1000 Mo', value: '901-1000' },
  { label: '1001-1100 Mo', value: '1001-1100' },
  { label: '1101-1200 Mo', value: '1101-1200' },
  { label: '1201-1300 Mo', value: '1201-1300' },
  { label: '1301-1400 Mo', value: '1301-1400' },
  { label: '1401-1500 Mo', value: '1401-1500' },
  { label: '1501-1600 Mo', value: '1501-1600' },
  { label: '1601-1700 Mo', value: '1601-1700' },
  { label: '1701-1800 Mo', value: '1701-1800' },
  { label: '1801-1900 Mo', value: '1801-1900' },
  { label: '1901-2000 Mo', value: '1901-2000' }
];

const businessTypeData = [
  { label: 'Non-Profit', value: 'non_profit' },
  { label: 'Retail', value: 'retail' },
  { label: 'Manufacturing', value: 'manufacturing' },
  { label: 'IT Service', value: 'it_service' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Finance', value: 'finance' },
  { label: 'Hospitality', value: 'hospitality' },
  { label: 'Construction', value: 'construction' },
  { label: 'Education', value: 'education' },
  { label: 'Transportation', value: 'transportation' },
  { label: 'Real Estate', value: 'real_estate' },
  { label: 'Food Service', value: 'food_service' },
  { label: 'Entertainment', value: 'entertainment' },
  { label: 'Consulting', value: 'consulting' },
  { label: 'Agriculture', value: 'agriculture' },
  { label: 'E-commerce', value: 'ecommerce' },
  { label: 'Influencer', value: 'influencer' },
  { label: 'Sports', value: 'sports' },
  { label: 'Industry', value: 'industry' },
  { label: 'Energy', value: 'energy' }
];

const ageRangeData = [
  { label: '0-12', value: '0-12' },
  { label: '13-17', value: '13-17' },
  { label: '18-25', value: '18-25' },
  { label: '26-35', value: '26-35' },
  { label: '36-45', value: '36-45' },
  { label: '46-54', value: '46-54s' },
  { label: '55-64', value: '55-64' },
  { label: '65+', value: '65+' }
];
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);

    console.log("Connected to MongoDB!");

    // Insert data into collections
    await AppSize.insertMany(appSizeData);
    await BusinessType.insertMany(businessTypeData);
    await AgeRange.insertMany(ageRangeData);

    console.log("Seeding successful!");
    mongoose.connection.close();
  } catch (err) {
    console.error("Error seeding database:", err);
  }
}

seed();
