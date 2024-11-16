const AgeRange = require("../models/age_range.model"); // Adjust the path to where your AgeRange model is located

const getAgeRanges = async (req, res) => {
  try {
    const { query } = req;
    const { page = 1, limit = 20, search, active } = query;
    let filter = {};

    // Filter by active status if provided
    if (active !== undefined) {
      filter.active = active === "true"; // Convert 'true'/'false' to boolean
    }

    // Optional search filter for 'label'
    if (search) {
      filter.label = { $regex: new RegExp(search, "i") }; // Case insensitive search
    }

    // Define the aggregation pipeline
    const pipeline = [
      { $match: filter }, // Apply filter to the collection
      {
        $project: {
          label: 1,
          value: 1,
          quote: 1,
          active:1
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
    const result = await AgeRange.aggregatePaginate(
      AgeRange.aggregate(pipeline),
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

const createAgeRange = async (req, res) => {
  try {
    const { label, value, active, quote } = req.body;

    // Check if a document with the same 'value' already exists (unique constraint)
    const existingAgeRange = await AgeRange.findOne({ value });
    if (existingAgeRange) {
      return res.status(400).json({
        error: true,
        message: "Age range with this value already exists.",
      });
    }

    // Create a new AgeRange document
    const newAgeRange = new AgeRange({
      label,
      value,
      active: active !== undefined ? active : true, // Default active to true if not provided
      quote: quote !== undefined ? quote : null, // Default quote to null if not provided
    });

    await newAgeRange.save();

    return res.status(201).json({
      error: false,
      message: "Age range created successfully.",
      data: newAgeRange,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

const updateAgeRangeQuote = async (req, res) => {
  try {
    const value = req.body; // Use the 'value' as a unique identifier
    const { quote } = req.body;
    if(!quote){ 
      return res.status(400).json({
        error: true,
        msg: "Please provide quote value",
      });
    }
    // Find the age range by its value
    const ageRange = await AgeRange.findById({ _id: value.id });
    if (!ageRange) {
      return res.status(404).json({
        error: true,
        msg: "Age range not found",
      });
    }

    ageRange.quote = quote !== undefined ? quote : ageRange.quote;

    // Save the updated document
    await ageRange.save();

    return res.status(200).json({
      error: false,
      msg: "Age range updated successfully",
      data: ageRange,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};
const updateAgeRangeStatus = async (req, res) => {
  try {
    const {_id} = req.body; // Use the 'value' as a unique identifier
    const { active } = req.body;
    // Find the age range by its value
    const ageRange = await AgeRange.findById({ _id: _id });
    if (!ageRange) {
      return res.status(404).json({
        error: true,
        msg: "Age range not found",
      });
    }

    ageRange.active = active;

    // Save the updated document
    await ageRange.save();

    return res.status(200).json({
      error: false,
      msg: "Age range updated successfully",
      data: ageRange,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};
const deleteAgeRange = async (req, res) => {
  try {
    const { value } = req.params; // Use the 'value' parameter from the request URL

    // Find and delete the age range by 'value'
    const deletedAgeRange = await AgeRange.findOneAndDelete({ value });

    if (!deletedAgeRange) {
      return res.status(404).json({
        error: true,
        message: "Age range not found.",
      });
    }

    return res.status(200).json({
      error: false,
      message: "Age range deleted successfully.",
      data: deletedAgeRange,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};

module.exports = {
  getAgeRanges,
  createAgeRange,
  updateAgeRangeQuote,
  updateAgeRangeStatus,
  deleteAgeRange,
};
