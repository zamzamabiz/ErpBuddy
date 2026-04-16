// Script to seed default number series for all companies and modules
const mongoose = require('mongoose');
const config = require('../src/config/db.config');
const Company = require('../src/modules/core/company/company.model');
const NumberSeriesService = require('../src/shared/numberSeries.service');

async function main() {
  await mongoose.connect(config.mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
  const companies = await Company.find({});
  for (const company of companies) {
    await NumberSeriesService.seedDefaults(company._id);
    console.log(`Seeded number series for company: ${company.name}`);
  }
  await mongoose.disconnect();
  console.log('Seeding complete.');
}

main().catch(err => {
  console.error('Error seeding number series:', err);
  process.exit(1);
});
