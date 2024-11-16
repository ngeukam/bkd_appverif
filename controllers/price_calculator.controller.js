const calculateTotalPrice = require("../utils/priceCalculator");
const TotalPrice = async (req, res) => {
  try {
    // const { formData } = req.body;
    const totalPrice = await calculateTotalPrice(req.body);
    res.json({ totalPrice });
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate price" });
  }
};
module.exports = TotalPrice;
