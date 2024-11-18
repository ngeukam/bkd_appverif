const BusinessType = require("../models/business_type.model"); // Adjust path as necessary

const getBusinessTypes = async (req, res) => {
  try {
    const { query } = req;
    const { page = 1, limit = 30, search, active } = query;
    let filter = {};

    // Filter by active status if provided
    if (active !== undefined) {
      filter.active = active === "true"; // Convert 'true'/'false' to boolean
    }

    // Optional search filter for 'label' or 'value'
    if (search) {
      filter.$or = [
        { label: { $regex: new RegExp(search, "i") } },
        { value: { $regex: new RegExp(search, "i") } },
      ];
    }

    // Define the aggregation pipeline
    const pipeline = [
      { $match: filter }, // Apply filter to the collection
      {
        $project: {
          label: 1,
          value: 1,
          quote: 1,
          active: 1,
        },
      },
      // {
      //   $sort: { createdAt: -1 },  // Sort by created date in descending order
      // },
    ];

    // Pagination options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    // Use aggregatePaginate to paginate the results
    const result = await BusinessType.aggregatePaginate(
      BusinessType.aggregate(pipeline),
      options
    );

    return res.status(200).json({
      error: false,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

const createBusinessType = async (req, res) => {
  try {
    const { label, value, active, quote } = req.body;

    // Check if BusinessType with the same value already exists
    const existingBusinessType = await BusinessType.findOne({ value });
    if (existingBusinessType) {
      return res.status(400).json({
        error: true,
        message: "Business type with this value already exists.",
      });
    }

    // Create a new BusinessType
    const newBusinessType = new BusinessType({
      label,
      value,
      active: active !== undefined ? active : true, // Default to active if not provided
      quote: quote !== undefined ? quote : null, // Default quote to null if not provided
    });

    await newBusinessType.save();

    return res.status(201).json({
      error: false,
      message: "Business type created successfully.",
      data: newBusinessType,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};
const updateBusinessQuote = async (req, res) => {
  try {
    const value = req.body; // Use the 'value' as a unique identifier
    const { quote } = req.body;
    if (!quote) {
      return res.status(400).json({
        error: true,
        msg: "Please provide quote value",
      });
    }

    // Find the BusinessType by 'value'
    const businessType = await BusinessType.findById({ _id: value.id });
    if (!businessType) {
      return res.status(404).json({
        error: true,
        message: "Business type not found.",
      });
    }

    businessType.quote = quote !== undefined ? quote : businessType.quote;

    // Save the updated BusinessType
    await businessType.save();

    return res.status(200).json({
      error: false,
      message: "Business type updated successfully.",
      data: businessType,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};
const updateBusinessStatus = async (req, res) => {
  try {
    const {_id} = req.body; // Use the 'value' as a unique identifier
    const { active } = req.body;
    // Find the age range by its value
    const businessType = await BusinessType.findById({ _id: _id });
    if (!businessType) {
      return res.status(404).json({
        error: true,
        msg: "Business type not found",
      });
    }

    businessType.active = active;

    // Save the updated document
    await businessType.save();

    return res.status(200).json({
      error: false,
      msg: "Business type updated successfully",
      data: ageRange,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};
const deleteBusinessType = async (req, res) => {
  try {
    const { value } = req.params; // 'value' is the unique identifier

    // Find and delete the BusinessType
    const deletedBusinessType = await BusinessType.findOneAndDelete({ value });

    if (!deletedBusinessType) {
      return res.status(404).json({
        error: true,
        message: "Business type not found.",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Business type deleted successfully.",
      data: deletedBusinessType,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};
module.exports = {
  getBusinessTypes,
  createBusinessType,
  updateBusinessQuote,
  updateBusinessStatus,
  deleteBusinessType,
};
