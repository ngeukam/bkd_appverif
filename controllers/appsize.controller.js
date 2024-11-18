const AppSize = require("../models/app_size.model"); // Adjust the path as necessary

const getAppSizes = async (req, res) => {
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
          active:1
        },
      },
      
    ];

    // Apply aggregation and pagination using aggregatePaginate
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
    };

    // Use aggregatePaginate to paginate the results
    const result = await AppSize.aggregatePaginate(
      AppSize.aggregate(pipeline),
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

const createAppSize = async (req, res) => {
  try {
    const { label, value, active, quote } = req.body;

    // Check if AppSize with the same value already exists
    const existingAppSize = await AppSize.findOne({ value });
    if (existingAppSize) {
      return res.status(400).json({
        error: true,
        message: "App size with this value already exists.",
      });
    }

    // Create a new AppSize
    const newAppSize = new AppSize({
      label,
      value,
      active: active !== undefined ? active : true, // Default to active if not provided
      quote: quote !== undefined ? quote : null, // Default quote to null if not provided
    });

    await newAppSize.save();

    return res.status(201).json({
      error: false,
      message: "App size created successfully.",
      data: newAppSize,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};
const updateAppSizeQuote = async (req, res) => {
  try {
    const value = req.body; // Use the 'value' as a unique identifier
    const { quote } = req.body;
    if(!quote){ 
      return res.status(400).json({
        error: true,
        msg: "Please provide quote value",
      });
    }
    // Find the AppSize by 'value'
    const appSize = await AppSize.findById({ _id: value.id });
    if (!appSize) {
      return res.status(404).json({
        error: true,
        message: "App size not found.",
      });
    }
    appSize.quote = quote !== undefined ? quote : appSize.quote;

    // Save the updated AppSize
    await appSize.save();

    return res.status(200).json({
      error: false,
      message: "App size updated successfully.",
      data: appSize,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};
const updateAppSizeStatus = async (req, res) => {
  try {
    const {_id} = req.body; // Use the 'value' as a unique identifier
    const { active } = req.body;
    // Find the age range by its value
    const appSize = await AppSize.findById({ _id: _id });
    if (!appSize) {
      return res.status(404).json({
        error: true,
        msg: "App size not found",
      });
    }

    appSize.active = active;

    // Save the updated document
    await appSize.save();

    return res.status(200).json({
      error: false,
      msg: "App size updated successfully",
      data: ageRange,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};
const deleteAppSize = async (req, res) => {
  try {
    const { value } = req.params; // 'value' is the unique identifier

    // Find and delete the AppSize
    const deletedAppSize = await AppSize.findOneAndDelete({ value });

    if (!deletedAppSize) {
      return res.status(404).json({
        error: true,
        message: "App size not found.",
      });
    }

    return res.status(200).json({
      error: false,
      message: "App size deleted successfully.",
      data: deletedAppSize,
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      message: error.message,
    });
  }
};
module.exports = {
  getAppSizes,
  createAppSize,
  updateAppSizeQuote,
  updateAppSizeStatus,
  deleteAppSize,
};
