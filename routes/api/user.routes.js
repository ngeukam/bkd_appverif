const {
	userVerifyByEmail,
	userUpdateByToken,
	userSocialLogin,
	userDetails,
	getLoginUserDataByToken,
	userRegistration,
	confirmEmail,
	userLogin,
	checkEmailExistRequestToken,
	changePasswordRequest,
	getUsersWithWalletAmounts,
	getUserDetailsWithWallet,
	countTestersAndVerifiedUsers
} = require("../../controllers/user.controller");
const { userAuth } = require("../../auth");
const { Router } = require("express");

const userRoutes = Router();
userRoutes.post("/social-login", userSocialLogin);
userRoutes.get("/verify-by-email", userVerifyByEmail);
userRoutes.post(
	"/update-by-token",
	userAuth({ isAuth: true }),
	userUpdateByToken
);
userRoutes.get("/details", userAuth({ isAuth: true }), userDetails);
userRoutes.get("/verify", userAuth({ isAuth: true }), getLoginUserDataByToken);
userRoutes.post("/registration", userRegistration);
userRoutes.post("/confirm-email", confirmEmail);
userRoutes.post("/login", userLogin);
userRoutes.post("/check-email", checkEmailExistRequestToken);
userRoutes.post("/change-password", changePasswordRequest);
userRoutes.get("/all-users", userAuth({ isAdmin: true }), getUsersWithWalletAmounts);
userRoutes.get("/details-with-wallet", userAuth({ isAdmin: true }), getUserDetailsWithWallet);
userRoutes.get("/count-tester-user", userAuth({ isAdmin: true }), countTestersAndVerifiedUsers);

module.exports = userRoutes;
