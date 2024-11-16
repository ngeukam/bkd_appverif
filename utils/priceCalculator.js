const AgeRange = require("../models/age_range.model");
const BusinessCategory = require("../models/business_type.model");
const AppSize = require("../models/app_size.model");

const calculateTotalPrice = async (formData) => {
  let total = 0;

  // Calculate price for age range
  if (formData.age && Array.isArray(formData.age)) {
    for (const age of formData.age) {
      const agePrice = await AgeRange.findOne({
        value: age,
        active: true,
      }).lean();
      total += agePrice ? agePrice.quote : 0.1; // Default value if price is not found

    }
  }

  // Calculate price for business category
  if (formData.business && Array.isArray(formData.business)) {
    for (const business of formData.business) {
      const businessPrice = await BusinessCategory.findOne({
        value: business,
        active: true,
      }).lean();
      total += businessPrice ? businessPrice.quote : 0.1; // Default value if price is not found
    }
  }

  // Calculate price for app size
  if (formData.app_size) {
    const appSizePrice = await AppSize.findOne({
      value: formData.app_size,
      active: true,
    }).lean();
    total += appSizePrice ? appSizePrice.quote : 0.5; // Default value if price is not found
  }

  // Multiply by the number of testers
  if (formData.nb_tester && !isNaN(formData.nb_tester)) {
    total *= formData.nb_tester;
  }
  // Date range calculation
  if (formData.start_date && formData.end_date) {
    const startDate = Date.parse(formData.start_date);
    const endDate = Date.parse(formData.end_date);
    if (startDate && endDate && endDate > startDate) {
      const daysDifference = Math.ceil(
        (endDate - startDate) / (1000 * 60 * 60 * 24)
      );
      total *= daysDifference;
    }
  }
 

  // Adding a margin (e.g., 40%)
  return Math.ceil(total * 1.4);
};
module.exports = calculateTotalPrice;
