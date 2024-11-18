const {
	getListsPreferences,
	getTestersCount,
	createProjectAndPayWithCash,
	createProjectAndPayWithWallet,
	listProjectsByTester,
	testerDeclineProject,
	testerAcceptProject,
	getTesterAcceptedProjects,
	countTesterAcceptedProjects,
	countUserProjects,
	getAllUserProjects,
	countTesterAssignedProject,
	deleteProject,
	getAllProjects,
	getProjectDetails,
	validateCashPayment,
	getCurrentCommission,
	updateCurrentCommission,
	completeTestAndDistributePayments,
	updateTesterList,
	updateAcceptedProjectTester,
	addTesterToSelectedList,
	calculatePlatformRevenue,
	countVerifiedAndCompletedProjects
} = require("../../controllers/project.controller");
const { Router } = require("express");
const { userAuth } = require("../../auth");
const projectsRoutes = Router();
projectsRoutes.get(
	"/list-preferences",
	userAuth({ isAuth: true }),
	getListsPreferences
);
projectsRoutes.post(
	"/available-testers",
	userAuth({ isAuth: true }),
	getTestersCount
);
projectsRoutes.post(
	"/create-project-pay-cash",
	userAuth({ isAuth: true }),
	createProjectAndPayWithCash
);
projectsRoutes.post(
	"/create-project-pay-wallet",
	userAuth({ isAuth: true }),
	createProjectAndPayWithWallet
);
projectsRoutes.post(
	"/delete-project",
	userAuth({ isAuth: true }),
	deleteProject
);
projectsRoutes.get(
	"/tester-projects-list",
	userAuth({ isAuth: true }),
	listProjectsByTester
);
projectsRoutes.post(
	"/decline-project",
	userAuth({ isAuth: true }),
	testerDeclineProject
);
projectsRoutes.post(
	"/accept-project",
	userAuth({ isAuth: true }),
	testerAcceptProject
);
projectsRoutes.get(
	"/tester-projects-accepted",
	userAuth({ isAuth: true }),
	getTesterAcceptedProjects
);
projectsRoutes.get(
	"/count-tester-projects-accepted",
	userAuth({ isAuth: true }),
	countTesterAcceptedProjects
);
projectsRoutes.get(
	"/count-user-projects",
	userAuth({ isAuth: true }),
	countUserProjects
);
projectsRoutes.get(
	"/user-projects",
	userAuth({ isAuth: true }),
	getAllUserProjects
);
projectsRoutes.get(
	"/count-tester-assigned-project",
	userAuth({ isAuth: true }),
	countTesterAssignedProject
);
projectsRoutes.get(
	"/current-rate",
	userAuth({ isAuth: true }),
	getCurrentCommission
);

//Admin
projectsRoutes.get(
	"/all-projects",
	userAuth({ isAdmin: true }),
	getAllProjects
);
projectsRoutes.get(
	"/details",
	userAuth({ isAdmin: true }),
	getProjectDetails
);
projectsRoutes.post(
	"/cash-validation",
	userAuth({ isAdmin: true }),
	validateCashPayment
);
projectsRoutes.post(
	"/update-rate",
	userAuth({ isAdmin: true }),
	updateCurrentCommission
);
projectsRoutes.post(
	"/complete-test",
	userAuth({ isAdmin: true }),
	completeTestAndDistributePayments
);
projectsRoutes.post(
	"/change-selected-tester",
	userAuth({ isAdmin: true }),
	updateTesterList
);
projectsRoutes.post(
	"/change-accepted-tester",
	userAuth({ isAdmin: true }),
	updateAcceptedProjectTester
);
projectsRoutes.post(
	"/add-tester",
	userAuth({ isAdmin: true }),
	addTesterToSelectedList
);
projectsRoutes.get(
	"/platform-revenue",
	userAuth({ isAdmin: true }),
	calculatePlatformRevenue
);
projectsRoutes.get(
	"/count-verif-completed-project",
	userAuth({ isAdmin: true }),
	countVerifiedAndCompletedProjects
);
module.exports = projectsRoutes;
