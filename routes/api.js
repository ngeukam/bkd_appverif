const { Router } = require("express");
const userRoutes = require("./api/user.routes");
const languagesRoutes = require("./api/translation.route");
const projectsRoutes = require("./api/project.route");
const paymentsRoutes = require("./api/payment.route");
const walletRoutes = require("./api/wallet.route");
const withdrawRoutes = require("./api/withdraw.route");
const fileRoutes = require("./api/file.route")
const apiRouters = Router();
apiRouters.use("/user", userRoutes);
apiRouters.use("/settings", languagesRoutes);
apiRouters.use("/project", projectsRoutes);
apiRouters.use("/payment", paymentsRoutes);
apiRouters.use("/wallet", walletRoutes);
apiRouters.use("/withdraw", withdrawRoutes);
apiRouters.use("/file", fileRoutes);
module.exports = apiRouters;
