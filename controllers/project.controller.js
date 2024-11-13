const User = require("../models/user.model");
const Project = require("../models/project.model");
const mongoose = require("mongoose");
const AcceptedProject = require("../models/accepted_project.model");
const createSuccessPayToken = require("../utils/createSuccesspayToken");
const Wallet = require("../models/wallet.model");
const crypto = require("crypto");
const Payment = require("../models/payment.model");
const { sendNotification, admin } = require("../utils/pushNotifications/push");
const { pricingRules } = require("../utils/price_rules");
const Commission = require("../models/commission.model");
const {
	sendGmailAddressToTester,
	sendGmailAddressToOwner,
	sendGmailAddressToConfirmPayTesters,
	sendGmailToAdmin
} = require("../utils/sendEmail");
// Fonction pour générer un code unique
const generateUniqueCode = async () => {
	const timestamp = Date.now().toString(); // Obtenir le timestamp actuel
	const hash = crypto.createHash("sha256").update(timestamp).digest("hex"); // Hachage du timestamp
	// Extraire 6 caractères du hachage
	const result = hash.substring(0, 6).toUpperCase(); // Prenez les 6 premiers caractères et transformez-les en majuscules
	// Vérifier l'unicité du code dans la base de données
	const existingProject = await Project.findOne({ code: result });
	if (existingProject) {
		return generateUniqueCode(); // Récursion si le code existe déjà
	}
	return result; // Retourner un code unique
};

//Get commission
const getCurrentCommission = async (req, res) => {
	try {
		const commission = await Commission.findOne().select("rate"); // Replace with actual field names
		if (!commission) {
			return res.status(404).json({ error: true, msg: "Commission not found" });
		}
		return res.status(200).json({ error: false, data: commission });
	} catch (error) {
		console.error("Error retrieving commission:", error);
		return res.status(500).json({
			error: true,
			msg: "Internal server error while retrieving commission",
		});
	}
};

//Update commission
const updateCurrentCommission = async (req, res) => {
	const { rateId, ...updateFields } = req.body;
	try {
		const result = await Commission.updateOne(
			{ _id: rateId },
			{ $set: updateFields }
		);

		if (result.matchedCount === 0) {
			return res.status(404).send({
				error: true,
				msg: "Commission rate not found",
			});
		}

		return res.status(200).send({
			error: false,
			msg: "Successfully updated",
			data: result,
		});
	} catch (error) {
		console.error("Error updating commission:", error);
		return res.status(500).send({
			error: true,
			msg: "Server failed",
		});
	}
};

// Fonctions pour créer un nouveau projet
const createProjectAndPayWithCash = async (req, res) => {
	const {
		name,
		link,
		description,
		app_size,
		app_logo,
		app_type,
		nb_tester,
		start_date,
		end_date,
		testers,
		amount,
		age,
		business,
		country,
		commission,
	} = req.body;

	try {
		if (
			amount <= 0 ||
			!start_date ||
			!end_date ||
			nb_tester <= 0 ||
			!link ||
			!app_type ||
			!name
		) {
			return res.status(400).json({
				success: false,
				message: "Please fill in all required fields",
			});
		}

		const calculateTotalPrice = (formData) => {
			let total = 0;
			// Calcul des prix selon les âges
			if (formData.age && Array.isArray(formData.age)) {
				formData.age.forEach((age) => {
					if (
						pricingRules.agePrices &&
						pricingRules.agePrices[age] !== undefined
					) {
						total += pricingRules.agePrices[age];
					} else {
						total += 0.1; // Valeur par défaut si la clé est inexistante
					}
				});
			} else {
				console.error('Invalid or missing "age" data:', formData.age);
			}

			// Calcul des prix selon le genre
			if (formData.business && Array.isArray(formData.business)) {
				formData.business.forEach((business) => {
					if (
						pricingRules.businessPrices &&
						pricingRules.businessPrices[business] !== undefined
					) {
						total += pricingRules.businessPrices[business];
					} else {
						total += 0.1; // Valeur par défaut si la clé est inexistante
					}
				});
			} else {
				console.error('Invalid or missing "business" data:', formData.business);
			}

			// Calcul des prix selon le pays
			if (formData.country && Array.isArray(formData.country)) {
				formData.country.forEach((country) => {
					if (
						pricingRules.countryPrices &&
						pricingRules.countryPrices[country] !== undefined
					) {
						total += pricingRules.countryPrices[country];
					} else {
						total += 0.05; // Valeur par défaut si la clé est inexistante
					}
				});
			} else {
				console.error('Invalid or missing "country" data:', formData.country);
			}

			// Calcul des prix selon la taille de l'app
			if (
				formData.app_size &&
				pricingRules.app_sizePrices &&
				pricingRules.app_sizePrices[formData.app_size] !== undefined
			) {
				total += pricingRules.app_sizePrices[formData.app_size];
			} else {
				total += 0.5; // Valeur par défaut si la clé est inexistante ou si formData.app_size est manquant
			}

			// Ajouter le prix pour les testeurs
			if (formData.nb_tester && !isNaN(formData.nb_tester)) {
				total *= formData.nb_tester; // Multiplier par le nombre de testeurs
			} else {
				console.error(
					'Invalid or missing "nb_tester" data:',
					formData.nb_tester
				);
			}

			// Calcul des différences de dates
			if (formData.start_date && formData.end_date) {
				const startDate = Date.parse(formData.start_date);
				const endDate = Date.parse(formData.end_date);
				if (startDate && endDate && endDate > startDate) {
					const daysDifference = Math.ceil(
						(endDate - startDate) / (1000 * 60 * 60 * 24)
					);
					total *= daysDifference; // Multiplier le prix par la différence de jours
				} else {
					console.error(
						"Invalid date range: start_date and end_date are incorrect."
					);
				}
			} else {
				console.error(
					"Invalid or missing date range: start_date and end_date."
				);
			}

			return Math.ceil(total);
		};

		const formData = {
			age,
			business,
			country,
			app_size,
			nb_tester,
			start_date,
			end_date,
		};
		const calculatedAmount = calculateTotalPrice(formData);
		if (calculatedAmount !== amount) {
			return res.status(400).json({
				success: false,
				message: "The calculated price does not match the provided price",
			});
		}
		let { _id } = res.locals.user || {};
		let user = await User.findById(_id);
		const useradmin = await User.find({ role: "admin" });
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Permission Denied",
			});
		}
		// Générer un code unique pour le projet
		const uniqueCode = await generateUniqueCode();
		const newProject = new Project({
			name,
			link,
			description,
			app_size,
			app_logo,
			app_type,
			nb_tester,
			start_date,
			end_date,
			user,
			testers,
			amount: calculatedAmount,
			code: uniqueCode,
			paymentMethod: "cash",
			commission,
		});
		const savedProject = await newProject.save();
		sendGmailToAdmin(savedProject);
		for (const admin of useradmin) {
			admin.fcm_token.forEach(async (token) => {
				await sendNotification(
					token,
					`New app adding`,
					`App: ${savedProject.name} Code: ${savedProject.code}`
				);
			});
		}

		res.status(201).json({
			success: true,
			message: "App created successfully",
			projectCode: savedProject?.code,
			projectName: savedProject?.name,
		});
	} catch (error) {
		console.error("Error creating project:", error);
		res.status(500).json({ success: false, message: "Failed to create app" });
	}
};

const createProjectAndPayWithWallet = async (req, res) => {
	let { _id } = res.locals.user;
	if (!_id) {
		return res.status(400).json({
			success: false,
			message: "Permission Denied",
		});
	}
	const {
		name,
		link,
		description,
		app_size,
		app_logo,
		app_type,
		nb_tester,
		start_date,
		end_date,
		testers,
		amount,
		age,
		business,
		country,
		commission,
	} = req.body;
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		// Vérifiez les données du projet
		if (
			amount <= 0 ||
			!start_date ||
			!end_date ||
			nb_tester <= 0 ||
			!link ||
			!app_type ||
			!name
		) {
			return res.status(400).json({
				success: false,
				message: "Please fill in all required fields",
			});
		}
		const calculateTotalPrice = (formData) => {
			let total = 0;
			// Calcul des prix selon les âges
			if (formData.age && Array.isArray(formData.age)) {
				formData.age.forEach((age) => {
					if (
						pricingRules.agePrices &&
						pricingRules.agePrices[age] !== undefined
					) {
						total += pricingRules.agePrices[age];
					} else {
						total += 0.1; // Valeur par défaut si la clé est inexistante
					}
				});
			} else {
				console.error('Invalid or missing "age" data:', formData.age);
			}

			// Calcul des prix selon le genre
			if (formData.business && Array.isArray(formData.business)) {
				formData.business.forEach((business) => {
					if (
						pricingRules.businessPrices &&
						pricingRules.businessPrices[business] !== undefined
					) {
						total += pricingRules.businessPrices[business];
					} else {
						total += 0.1; // Valeur par défaut si la clé est inexistante
					}
				});
			} else {
				console.error('Invalid or missing "business" data:', formData.business);
			}

			// Calcul des prix selon le pays
			if (formData.country && Array.isArray(formData.country)) {
				formData.country.forEach((country) => {
					if (
						pricingRules.countryPrices &&
						pricingRules.countryPrices[country] !== undefined
					) {
						total += pricingRules.countryPrices[country];
					} else {
						total += 0.05; // Valeur par défaut si la clé est inexistante
					}
				});
			} else {
				console.error('Invalid or missing "country" data:', formData.country);
			}

			// Calcul des prix selon la taille de l'app
			if (
				formData.app_size &&
				pricingRules.app_sizePrices &&
				pricingRules.app_sizePrices[formData.app_size] !== undefined
			) {
				total += pricingRules.app_sizePrices[formData.app_size];
			} else {
				total += 0.5; // Valeur par défaut si la clé est inexistante ou si formData.app_size est manquant
			}

			// Ajouter le prix pour les testeurs
			if (formData.nb_tester && !isNaN(formData.nb_tester)) {
				total *= formData.nb_tester; // Multiplier par le nombre de testeurs
			} else {
				console.error(
					'Invalid or missing "nb_tester" data:',
					formData.nb_tester
				);
			}

			// Calcul des différences de dates
			if (formData.start_date && formData.end_date) {
				const startDate = Date.parse(formData.start_date);
				const endDate = Date.parse(formData.end_date);
				if (startDate && endDate && endDate > startDate) {
					const daysDifference = Math.ceil(
						(endDate - startDate) / (1000 * 60 * 60 * 24)
					);
					total *= daysDifference; // Multiplier le prix par la différence de jours
				} else {
					console.error(
						"Invalid date range: start_date and end_date are incorrect."
					);
				}
			} else {
				console.error(
					"Invalid or missing date range: start_date and end_date."
				);
			}

			return Math.ceil(total);
		};
		const formData = {
			age,
			business,
			country,
			app_size,
			nb_tester,
			start_date,
			end_date,
		};
		const calculatedAmount = calculateTotalPrice(formData);

		if (calculatedAmount !== amount) {
			return res.status(400).json({
				success: false,
				message: "The calculated price does not match the provided price",
			});
		}
		const user = await User.findById(_id).session(session);
		const useradmin = await User.find({ role: "admin" }).session(session);
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Permission Denied",
			});
		}

		const wallets = await Wallet.find({ user: user._id }).session(session);
		const totalAmount = wallets.reduce((sum, wallet) => sum + wallet.amount, 0);

		if (totalAmount < calculatedAmount) {
			await session.abortTransaction();
			return res.status(400).json({ message: "Insufficient funds in wallet" });
		}

		let remainingAmount = calculatedAmount;

		for (let wallet of wallets) {
			if (remainingAmount <= 0) break;

			const amountToDeductFromWallet = Math.min(wallet.amount, remainingAmount);
			wallet.amount -= amountToDeductFromWallet;
			remainingAmount -= amountToDeductFromWallet;

			await wallet.save({ session });
		}

		// Générer un code unique pour le projet
		const uniqueCode = await generateUniqueCode();
		const newProject = new Project({
			name,
			link,
			description,
			app_size,
			app_logo,
			app_type,
			nb_tester,
			start_date,
			end_date,
			user,
			testers,
			verified: true,
			amount: calculatedAmount,
			code: uniqueCode,
			paymentMethod: "wallet",
			commission,
		});

		// Sauvegarder le projet dans la base de données
		const savedProject = await newProject.save({ session });

		// Enregistrez le paiement
		const payment = new Payment({
			user: _id,
			project: savedProject._id,
			amount: calculatedAmount,
			paymentMethod: "wallet",
			status: "completed",
		});
		await payment.save({ session });

		// Envoyer des notifications et des emails aux testeurs
		const selectedtesters = await User.find({ _id: { $in: testers } }).session(
			session
		);
		for (const tester of selectedtesters) {
			sendGmailAddressToTester(tester.email, savedProject);
			tester.fcm_token.forEach(async (token) => {
				await sendNotification(
					token,
					`Congratulations! You have been received invitation to test the app: ${savedProject.name}`,
					`App code: ${savedProject.code}`
				);
			});
		}
		sendGmailToAdmin(savedProject);
		for (const admin of useradmin) {
			admin.fcm_token.forEach(async (token) => {
				await sendNotification(
					token,
					`New app adding`,
					`App: ${savedProject.name} Code: ${savedProject.code}`
				);
			});
		}

		// Commit transaction
		await session.commitTransaction();

		const successToken = createSuccessPayToken(
			savedProject._id,
			savedProject.amount,
			_id
		);

		res.status(201).json({
			success: true,
			message: "App created successfully",
			token: successToken,
			paymentSuccessUrl: `/app/payment-success?token=${successToken}`,
			paymentMethod: savedProject.paymentMethod,
		});
	} catch (error) {
		await session.abortTransaction();
		console.error("Transaction aborted due to error:", error);
		res.status(500).json({ success: false, message: "Failed to create app" });
	} finally {
		session.endSession();
	}
};

// List all projects for a specific tester
const listProjectsByTester = async (req, res) => {
	const currentPage = parseInt(req.query.currentPage || "1", 10); // Default to page 1 if not specified
	try {
		const { _id } = res.locals.user || {};
		if (!_id) {
			return res.status(400).json({
				success: false,
				message: "Permission Denied",
			});
		}

		const aggregate = Project.aggregate([
			// Étape 1 : Faire un $lookup pour joindre la collection "payments"
			{
				$lookup: {
					from: "payments",
					localField: "_id",
					foreignField: "project",
					as: "payments",
				},
			},
			// Étape 2 : Filtrer pour n'inclure que les projets avec des paiements "completed"
			{
				$unwind: "$payments",
			},
			{
				$match: {
					testers: new mongoose.Types.ObjectId(_id),
					"payments.status": "completed",
				},
			},
			// Étape 3 : Projeter les champs requis
			{
				$addFields: {
					net_amount: {
						$subtract: [
							"$amount",
							{
								$multiply: ["$amount", { $ifNull: ["$commission", 0.05] }],
							},
						],
					},
				},
			},
		]);

		const options = {
			page: currentPage,
			limit: 6,
			sort: { createdAt: -1 },
		};

		const projects = await Project.aggregatePaginate(aggregate, options);
		return res.status(200).json({
			success: true,
			data: projects.docs.map((project) => ({
				...project,
				net_amount: project.net_amount,
			})),
			pagination: {
				totalDocs: projects.totalDocs,
				totalPages: projects.totalPages,
				page: projects.page,
				limit: projects.limit,
			},
		});
	} catch (error) {
		console.error("Error listing projects by tester:", error);
		return res.status(500).json({
			success: false,
			message: "An error occurred while retrieving projects.",
		});
	}
};

// Delete Project
const deleteProject = async (req, res) => {
	const { projectId } = req.body;
	try {
		// Check if the project exists
		const project = await Project.findById(projectId);
		if (!project) {
			return res.status(404).json({ error: true, msg: "Project not found" });
		}
		// Check conditions: verified and tested must be false
		if (project.verified === false) {
			await Project.findByIdAndDelete(projectId);
			return res
				.status(200)
				.json({ error: false, msg: "Project deleted successfully" });
		} else {
			return res.status(400).json({
				error: true,
				msg: "Project cannot be deleted",
			});
		}
	} catch (error) {
		console.error("Error deleting project:", error);
		return res.status(500).json({ error: true, msg: "Internal server error" });
	}
};

//Tester Decline Project
const testerDeclineProject = async (req, res) => {
	let { projectId } = req.body;
	try {
		const { _id } = res.locals.user || {};
		if (!_id) {
			return res.status(400).json({
				success: false,
				message: "Permission Denied",
			});
		}
		// Vérifier si le testeur a déjà accepté le projet
		const alreadyAccepted = await AcceptedProject.findOne({
			tester: _id,
			project: projectId,
		});
		if (alreadyAccepted) {
			return res
				.status(400)
				.json({ message: "Cannot decline an already accepted project." });
		}
		await Project.findByIdAndUpdate(
			projectId,
			{ $pull: { testers: _id } },
			{ new: true }
		);
		return res.status(200).send({
			error: false,
			message: "Successfully updated",
		});
	} catch (error) {
		console.error("Error to removing tester:", error);
	}
};

// Un Testeur qui accepte un projet
const testerAcceptProject = async (req, res) => {
	const { projectId } = req.body;
	const session = await mongoose.startSession();

	try {
		session.startTransaction();

		let { _id } = res.locals.user || {};
		let user = await User.findById(_id).session(session);
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Permission Denied",
			});
		}
		const project = await Project.findById(projectId);
		const currentDate = new Date();

		if (
			currentDate.toLocaleDateString() > project.start_date.toLocaleDateString()
		) {
			return res.status(400).json({
				success: false,
				message: "The project is closed.",
			});
		}
		const acceptedProject = new AcceptedProject({
			tester: user._id,
			project: projectId,
			confirmationDate: new Date(),
			status_of_test: "in progress",
		});

		// Enregistrement dans AcceptedProject avec la session active
		await acceptedProject.save({ session });

		// Suppression du testeur de la liste `testers` du projet avec la session active
		await Project.findByIdAndUpdate(
			projectId,
			{ $pull: { testers: user._id } },
			{ new: true, session }
		);

		// Commit de la transaction si tout s'est bien passé
		await session.commitTransaction();

		res
			.status(201)
			.json({ message: "Tester accepted project", acceptedProject });
	} catch (error) {
		// Annulation de la transaction en cas d'erreur
		await session.abortTransaction();

		if (error.code === 11000) {
			// Code d'erreur pour violation d'unicité
			return res
				.status(400)
				.json({ message: "Tester is already assigned to this project." });
		}

		res.status(500).json({ message: "Failed to accept project", error });
	} finally {
		session.endSession();
	}
};

//Retrieve accepted project by specific tester
const getTesterAcceptedProjects = async (req, res) => {
	const currentPage = parseInt(req.query.currentPage || "1", 10); // Pagination parameters
	try {
		const { _id } = res.locals.user || {};
		if (!_id) {
			return res.status(400).json({
				success: false,
				message: "Permission Denied",
			});
		}

		const aggregate = AcceptedProject.aggregate([
			// Step 1: Match accepted projects for the tester
			{
				$match: { tester: new mongoose.Types.ObjectId(_id) },
			},
			// Step 2: Lookup to join with Project collection
			{
				$lookup: {
					from: "projects", // Assuming 'projects' is the collection name for the Project model
					localField: "project",
					foreignField: "_id",
					as: "project",
				},
			},
			// Step 3: Unwind the projectDetails array
			{
				$unwind: "$project",
			},

			// Step 4: Add the net_amount field
			{
				$addFields: {
					net_amount: {
						$subtract: [
							"$project.amount",
							{
								$multiply: [
									"$project.amount",
									{ $ifNull: ["$project.commission", 0.05] },
								],
							},
						],
					},
				},
			},
		]);

		// Pagination options
		const options = {
			page: currentPage,
			limit: 6,
			sort: { createdAt: -1 },
		};

		const testerAcceptedProjects = await AcceptedProject.aggregatePaginate(
			aggregate,
			options
		);
		return res.status(200).json({
			success: true,
			data: testerAcceptedProjects.docs.map((project) => ({
				...project,
				net_amount: project.net_amount,
			})),
			pagination: {
				totalDocs: testerAcceptedProjects.totalDocs,
				totalPages: testerAcceptedProjects.totalPages,
				page: testerAcceptedProjects.page,
				limit: testerAcceptedProjects.limit,
			},
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Failed to retrieve accepted projects for tester",
			error,
		});
	}
};

const countTesterAcceptedProjects = async (req, res) => {
	const { user } = res.locals || {};
	try {
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Permission Denied",
			});
		}
		const nbProject = (await AcceptedProject.find({ tester: user })).length;
		return res.status(200).json({
			success: true,
			nbProject,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Failed to count accepted projects for tester",
			error,
		});
	}
};

const countUserProjects = async (req, res) => {
	const { user } = res.locals || {};
	try {
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Permission Denied",
			});
		}
		const nbProject = (await Project.find({ user: user })).length;
		return res.status(200).json({
			success: true,
			nbProject,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Failed to count projects for user",
			error,
		});
	}
};
//All Projects of specific User
const getAllUserProjects = async (req, res) => {
	const currentPage = parseInt(req.query.currentPage || "1", 10); // Pagination
	try {
		const { user } = res.locals || {};
		if (!user) {
			return res.status(400).json({
				success: false,
				message: "Permission Denied",
			});
		}

		const aggregate = Project.aggregate([
			// Étape 1 : Filtrer les projets pour l'utilisateur
			{
				$match: { user: new mongoose.Types.ObjectId(user._id) },
			},
			// Étape 2 : Faire un $lookup pour joindre la collection "payments"
			{
				$lookup: {
					from: "payments", // Nom de la collection Payment
					localField: "_id",
					foreignField: "project",
					as: "payments",
				},
			},
			// Étape 5 : Faire un $lookup pour joindre "acceptedprojects" pour le champ status_of_test
			{
				$lookup: {
					from: "acceptedprojects",
					localField: "_id",
					foreignField: "project",
					as: "acceptedProjects",
				},
			},
			// Étape 3 : Aplatir le tableau des paiements
			{
				$unwind: {
					path: "$payments",
					preserveNullAndEmptyArrays: true, // Conserve les projets sans paiements
				},
			},
			// Étape 4 : Ajouter un champ pour déterminer si le projet est payé ou non
			{
				$addFields: {
					isPaid: {
						$cond: {
							if: {
								$eq: ["$payments.status", "completed"], // Vérifie si le paiement est "completed"
							},
							then: true,
							else: false,
						},
					},
				},
			},

			// Étape 6 : Ajouter le champ status_of_test (s'il existe) à partir de "acceptedProjects"
			{
				$addFields: {
					status_of_test: {
						$ifNull: [
							{ $arrayElemAt: ["$acceptedProjects.status_of_test", 0] },
							"not started",
						],
					},
				},
			},

			// Supprime le champ "acceptedProjects" pour simplifier le retour
			{
				$project: {
					acceptedProjects: 0,
				},
			},
		]);

		// Pagination options
		const options = {
			page: currentPage,
			limit: 6,
			sort: { createdAt: -1 },
		};
		const userProjects = await Project.aggregatePaginate(aggregate, options);
		return res.status(200).json({
			success: true,
			data: userProjects.docs,
			pagination: {
				totalDocs: userProjects.totalDocs,
				totalPages: userProjects.totalPages,
				page: userProjects.page,
				limit: userProjects.limit,
			},
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Failed to retrieve user projects",
			error,
		});
	}
};

const getListsPreferences = async (req, res) => {
	try {
		const hobbies = await User.distinct("hobbies", {
			is_tester: true,
		}).catch((err) => {
			console.error("Error fetching hobbies:", err);
			return [];
		});

		const ageRanges = await User.distinct("age_ranges", {
			is_tester: true,
		}).catch((err) => {
			console.error("Error fetching age_ranges:", err);
			return [];
		});

		const businessTypes = await User.distinct("business_types", {
			is_tester: true,
		}).catch((err) => {
			console.error("Error fetching business_types:", err);
			return [];
		});

		const phoneTypes = await User.distinct("phone_types", {
			is_tester: true,
		}).catch((err) => {
			console.error("Error fetching phone_types:", err);
			return [];
		});

		const gender = await User.distinct("gender", {
			is_tester: true,
		}).catch((err) => {
			console.error("Error fetching gender:", err);
			return [];
		});

		const countries = await User.distinct("country", {
			is_tester: true,
		}).catch((err) => {
			console.error("Error fetching country:", err);
			return [];
		});

		res.status(200).json({
			success: true,
			data: {
				hobbies,
				ageRanges,
				businessTypes,
				phoneTypes,
				gender,
				countries,
			},
		});
	} catch (error) {
		console.error("An unexpected error occurred:", error);
		res.status(500).json({
			success: false,
			message: "Une erreur est survenue lors de la récupération des données.",
		});
	}
};

// Contrôleur qui gére les critéres de choix des testeurs
const getTestersCount = async (req, res) => {
	try {
		// Récupérer les paramètres depuis la requête (GET ou POST)
		const {
			age_ranges,
			business_types,
			hobbies,
			phone_types,
			gender,
			country,
			nb_tester,
		} = req.body; // or req.query if using GET
		// Construire le tableau de conditions pour le $or
		let orConditions = [];
		// Ajout des conditions dynamiques pour chaque filtre
		if (age_ranges) {
			orConditions.push({ age_ranges }); // Exact match for age range
		}
		if (business_types) {
			orConditions.push({ business_types: { $in: business_types } }); // Match any of the business types
		}
		if (hobbies) {
			orConditions.push({ hobbies: { $in: hobbies } }); // Match any of the hobbies
		}
		// if (phone_types) {
		// 	if (phone_types.includes("web")) {
		// 		orConditions.push({ phone_types: { $in: ["ios", "android", "pc"] } });
		// 	} else {
		// 		orConditions.push({ phone_types: { $in: phone_types } }); // Match any of the other phone types
		// 	}
		// }
		if (gender) {
			orConditions.push({ gender }); // Match any of the hobbies
		}
		if (country) {
			orConditions.push({ country }); // Match any of the hobbies
		}

		// Construire le filtre avec $or si des conditions sont présentes
		let filter = {
			is_tester: true,
			verified: true,
			active: true,
			phone_types: {
				$in: phone_types.includes("web")
					? ["ios", "android", "pc"]
					: phone_types,
			},
			...(orConditions.length > 0 && { $or: orConditions }), // Ajouter $or seulement si des conditions existent
		};

		// Utiliser Mongoose pour compter les utilisateurs correspondant aux filtres
		const usersCount = await User.countDocuments(filter);
		// Récupérer tous les testeurs qui correspondent aux critères
		const potentialTesters = await User.find(filter);
		if (potentialTesters.length < nb_tester) {
			console.error("Not enough testers available");
		}
		// Mélanger et sélectionner un nombre aléatoire de testeurs
		const shuffledTesters = potentialTesters.sort(() => 0.5 - Math.random());
		const sampleTesters = shuffledTesters.slice(0, nb_tester);

		// Envoyer le résultat en réponse
		res.status(200).json({
			success: true,
			count: usersCount,
			selectedTesters: sampleTesters,
		});
	} catch (error) {
		console.error(error);
		res.status(500).json({
			success: false,
			message: "Erreur serveur",
		});
	}
};

const countTesterAssignedProject = async (req, res) => {
	const { projectId } = req.query;
	try {
		const project = await Project.findById(projectId);
		if (!project) {
			return res.status(400).json({
				success: false,
				message: "Project does not exist",
			});
		}
		const nbTesterAssigned = (await AcceptedProject.find({ project: project }))
			.length;
		return res.status(200).json({
			success: true,
			nbTesterAssigned,
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: "Failed to count testers assigned",
			error,
		});
	}
};

// *************Admin Part***********//

// Fonction pour obtenir tous les projets
const getAllProjects = async (req, res) => {
	try {
		const { query } = req;
		const { user } = res.locals;
		let filter = {};
		// Filtrage de recherche si une requête "search" est fournie
		if (query.search) {
			filter = {
				$or: [
					{ "user.name": { $regex: new RegExp(query.search, "i") } },
					{ "user.email": { $regex: new RegExp(query.search, "i") } },
					{ name: { $regex: new RegExp(query.search, "i") } },
					{ code: { $regex: new RegExp(query.search, "i") } },
					{ description: { $regex: new RegExp(query.search, "i") } },
				],
			};
		}
		if (user && user.role !== "admin") {
			filter.user = new mongoose.Types.ObjectId(user._id);
		}

		// Construction de l'agrégation
		const projects = await Project.aggregatePaginate(
			Project.aggregate([
				{ $match: filter },
				// Jointure avec la collection Payment pour obtenir le statut de paiement
				{
					$lookup: {
						from: "payments",
						let: { projectId: "$_id" },
						pipeline: [
							{ $match: { $expr: { $eq: ["$project", "$$projectId"] } } },
							{ $sort: { paymentDate: -1 } }, // tri pour avoir le paiement le plus récent
							{ $limit: 1 }, // On prend le dernier statut de paiement
							{ $project: { status: 1, amount: 1, paymentMethod: 1 } },
						],
						as: "payment",
					},
				},
				{ $unwind: { path: "$payment", preserveNullAndEmptyArrays: true } },

				{
					$lookup: {
						from: "acceptedprojects",
						let: { projectId: "$_id" },
						pipeline: [
							// Étape 1 : Filtrer les documents "acceptedprojects" qui correspondent au projet
							{
								$match: {
									$expr: {
										$eq: ["$project", "$$projectId"],
									},
								},
							},
							// Étape 2 : Récupérer tous les "status_of_test" et le nombre de testeurs acceptés
							{
								$group: {
									_id: "$project",
									acceptedTestersCount: { $sum: 1 }, // Nombre de testeurs acceptés
									status_of_test: { $first: "$status_of_test" }, // Récupérer le premier status_of_test
								},
							},
						],
						as: "acceptedTesters", // Résultat dans le champ "acceptedTesters"
					},
				},
				// Étape 2 : Ajout du champ "status_of_test" dans le document principal
				{
					$addFields: {
						status_of_test: {
							$ifNull: [
								{ $arrayElemAt: ["$acceptedTesters.status_of_test", 0] }, // Récupère le status_of_test du premier élément
								"not started", // Valeur par défaut si aucun status n'est trouvé
							],
						},
					},
				},
				{
					$unwind: {
						path: "$acceptedTesters",
						preserveNullAndEmptyArrays: true,
					},
				},

				// Ajout du champ net_amount calculé
				{
					$addFields: {
						retained_cost: {
							$multiply: ["$amount", { $ifNull: ["$commission", 0.05] }],
						},
						paymentStatus: "$payment.status",
						acceptedTestersCount: {
							$ifNull: ["$acceptedTesters.acceptedTestersCount", 0],
						},
					},
				},

				{
					$project: {
						name: 1,
						description: 1,
						user: 1,
						code: 1,
						app_size: 1,
						app_logo: 1,
						app_type: 1,
						nb_tester: 1,
						start_date: 1,
						end_date: 1,
						verified: 1,
						amount: 1,
						retained_cost: 1,
						paymentStatus: 1,
						paymentMethod: 1,
						status_of_test: 1,
						acceptedTestersCount: 1,
						createdAt: 1,
						updatedAt: 1,
					},
				},
			]),
			{
				page: query.page || 1,
				limit: query.size || 10,
				sort: { updatedAt: -1 },
			}
		);
		return res.status(200).json({
			error: false,
			data: projects,
		});
	} catch (error) {
		return res.status(500).json({
			error: true,
			msg: error.message,
		});
	}
};

// Détails du projet
const getProjectDetails = async (req, res) => {
	try {
		const { _id } = req.query; // Assuming you have the project ID in the query params

		const projectDetails = await Project.aggregate([
			// Step 1: Match the project with the given ID
			{
				$match: {
					_id: new mongoose.Types.ObjectId(_id),
				},
			},
			// Step 2: Lookup the owner (user) of the project to get their email
			{
				$lookup: {
					from: "users", // User collection
					localField: "user", // The field in Project that references the User
					foreignField: "_id",
					as: "owner", // Populate the project owner details
				},
			},
			{
				$unwind: {
					path: "$owner",
					preserveNullAndEmptyArrays: true,
				},
			},
			// Step 3: Lookup the testers associated with the project
			{
				$lookup: {
					from: "users", // The testers are stored in the 'users' collection
					localField: "testers", // The testers are stored as ObjectId in 'testers' field of the project
					foreignField: "_id",
					as: "testers", // We store the list of testers
				},
			},
			// Step 4: Lookup the testers who have accepted the project
			{
				$lookup: {
					from: "acceptedprojects", // Collection of accepted testers
					localField: "_id", // Use the project ID to match with accepted projects
					foreignField: "project",
					as: "acceptedTesters", // These are the testers who have accepted the project
				},
			},
			// Step 5: Lookup detailed information for the accepted testers (including their email)
			{
				$lookup: {
					from: "users", // We join the 'users' collection again to get email details for accepted testers
					localField: "acceptedTesters.tester", // The tester field within acceptedTesters
					foreignField: "_id",
					as: "acceptedTestersDetails", // This array will contain the accepted tester details
				},
			},
			{
				$addFields: {
					// Add the status_of_test field for each accepted tester (set to 'not started' if not available)
					"acceptedTesters.status_of_test": {
						$ifNull: [
							{ $arrayElemAt: ["$acceptedTesters.status_of_test", 0] },
							"not started", // Default status if none is found
						],
					},
				},
			},
			// Step 6: Project the necessary fields to shape the response
			{
				$project: {
					name: 1,
					code: 1,
					amount: 1,
					app_size: 1,
					app_type: 1,
					testers: { email: 1, _id: 1 }, // Get only the email of the testers
					acceptedTestersDetails: { email: 1, _id: 1 }, // Get only the email of the accepted testers
					nb_tester: 1,
					start_date: 1,
					end_date: 1,
					verified: 1,
					status: 1,
					link: 1,
					"owner.email": 1,
					paymentMethod: 1,
					"acceptedTesters.status_of_test": 1,
					net_amount: {
						$subtract: [
							"$amount",
							{ $multiply: ["$amount", { $ifNull: ["$commission", 0.05] }] },
						],
					},
				},
			},
		]);

		if (!projectDetails.length) {
			return res.status(404).json({ error: true, msg: "Project not found" });
		}
		// You should now have the correct project details with multiple accepted testers
		return res.status(200).json({
			error: false,
			data: projectDetails[0], // Return the first project (since we matched by ID)
		});
	} catch (error) {
		return res.status(500).json({
			error: true,
			msg: error.message,
		});
	}
};

//Valider le paiement au cash
const validateCashPayment = async (req, res) => {
	const { projectId } = req.body;
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const project = await Project.findOne({ _id: projectId }).session(session);
		if (!project) {
			return res.status(404).json({ error: true, msg: "Project not found" });
		}
		if (project.verified) {
			return res
				.status(400)
				.json({ error: true, msg: "Project already verified" });
		}
		const wallet = await Wallet.findOne({ user: project.user._id }).session(
			session
		);
		if (wallet && wallet.amount.toFixed(2) >= project.amount.toFixed(2)) {
			return res.status(400).json({
				error: true,
				msg: "User has funds in their wallet, cannot validate cash payment",
			});
		}
		project.verified = true;
		const payment = new Payment({
			user: project.user._id,
			project: project._id,
			amount: project.amount,
			paymentMethod: "cash",
			status: "completed",
		});
		await payment.save({ session });
		await project.save({ session });
		// Envoyer des notifications et des emails aux testeurs
		const selectedtesters = await User.find({
			_id: { $in: project.testers },
		}).session(session);
		for (const tester of selectedtesters) {
			await sendGmailAddressToTester(tester.email, project);
			tester.fcm_token.forEach(async (token) => {
				await sendNotification(
					token,
					`New app for testing: ${project.name}`,
					`Code of app: ${project.code}`
				);
			});
		}
		// Commit transaction
		await session.commitTransaction();
		res.status(201).json({
			success: true,
			msg: "Successfully validated cash payment",
		});
	} catch (error) {
		console.log(error);
		await session.abortTransaction();
		console.error("Transaction aborted due to error:", error);
		res
			.status(500)
			.json({ success: false, msg: "Failed to validate cash payment" });
	} finally {
		session.endSession();
	}
};
//complete Test And Distribute Payments
const completeTestAndDistributePayments = async (req, res) => {
	const session = await mongoose.startSession();
	session.startTransaction();
	try {
		const { projectId } = req.body;

		// Find the project and verify it's completed
		const project = await Project.findById(projectId).session(session);
		if (!project) {
			return res.status(404).json({ error: true, msg: "Project not found" });
		}

		// Mark tests as completed for testers who haven't been paid yet
		await AcceptedProject.updateMany(
			{
				project: projectId,
				confirmationDate: { $ne: null }, // Confirmed test
				tester_is_paid: false, // Only update if the tester hasn't been paid
			},
			{ $set: { status_of_test: "completed" } }
		).session(session);

		// Find accepted testers who are completed
		const acceptedTesters = await AcceptedProject.find({
			project: projectId,
			status_of_test: "completed",
		}).session(session);

		if (!acceptedTesters.length) {
			return res.status(400).json({
				error: true,
				msg: "No testers have completed this project",
			});
		}

		// Calculate the net amount to distribute to testers
		const netAmount =
			project.amount - project.amount * (project.commission || 0.05);
		const paymentPerTester = netAmount / acceptedTesters.length;

		// Update testers' wallets and mark them as paid
		const updatePromises = acceptedTesters.map(async (acceptedTester) => {
			let wallet = await Wallet.findOne({
				user: acceptedTester.tester,
			}).session(session);
			if (!wallet) {
				wallet = new Wallet({ user: acceptedTester.tester, amount: 0 });
				await wallet.save({ session });
			}

			// Add the payment to the wallet
			wallet.amount += paymentPerTester;
			await wallet.save({ session });

			// Mark tester as paid
			acceptedTester.tester_is_paid = true;
			await acceptedTester.save({ session });

			// Send notification and email to tester
			const tester = await User.findById(acceptedTester.tester).session(
				session
			);
			if (tester) {
				await sendGmailAddressToConfirmPayTesters(
					tester.email,
					project,
					paymentPerTester
				);

				if (tester.fcm_token) {
					await sendNotification(
						tester.fcm_token,
						"Test Completed",
						`You have been paid ${paymentPerTester} for completing the test.`
					);
				}
			}
		});

		// Wait for all tester wallet updates to finish
		await Promise.all(updatePromises);

		// Send notification and email to project owner
		const owner = await User.findById(project.user).session(session);
		if (owner) {
			await sendGmailAddressToOwner(owner.email, project);
			if (owner.fcm_token) {
				await sendNotification(
					owner.fcm_token,
					"Test Completed",
					`All testers have completed the test for your app ${project.name}.`
				);
			}
		}

		// Commit the transaction
		await session.commitTransaction();
		res.status(200).json({
			success: true,
			msg: "Payments distributed and testers notified",
		});
	} catch (error) {
		// Abort the transaction in case of error
		await session.abortTransaction();
		console.error("Error completing test and distributing payments:", error);
		res.status(500).json({
			error: true,
			msg:
				"An error occurred while completing the test and distributing payments",
		});
	} finally {
		// End the session
		session.endSession();
	}
};
// Controller to delete a tester and assign a new one with a session
const updateTesterList = async (req, res) => {
	const { projectId, testerId, newTesterId } = req.body;
	// Start a session
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		// Find the project by ID within the transaction
		const project = await Project.findById(projectId).session(session);
		if (!project) {
			await session.abortTransaction();
			session.endSession();
			return res.status(404).json({ error: true, msg: "Project not found" });
		}

		// Check if the tester exists in the list
		const testerIndex = project.testers.indexOf(testerId);
		if (testerIndex === -1) {
			await session.abortTransaction();
			session.endSession();
			return res
				.status(404)
				.json({ error: true, msg: "Tester not found in the list" });
		}
		// Remove the tester from the list
		project.testers.splice(testerIndex, 1);
		// Assign a new tester if provided
		if (newTesterId) {
			// Check if new tester is a valid user within the transaction
			const newTester = await User.findOne({
				_id: newTesterId,
				verified: true,
				is_tester: true,
			}).session(session);
			if (!newTester) {
				await session.abortTransaction();
				session.endSession();
				return res.status(404).json({
					error: true,
					msg: "New tester is not verified or not a tester",
				});
			}

			// Add new tester to the list
			project.testers.push(newTesterId);
			await sendGmailAddressToTester(newTester.email, project);
			newTester.fcm_token.forEach(async (token) => {
				await sendNotification(
					token,
					`Congratulations! You have been selected to test app: ${project.name}`,
					`App code: ${project.code}`
				);
			});
		}

		// Save changes to the project within the transaction
		await project.save({ session });
		// Commit the transaction
		await session.commitTransaction();
		session.endSession();
		res.status(200).json({
			error: false,
			msg: "Tester updated successfully",
			project,
		});
	} catch (error) {
		console.error("Error updating tester:", error);
		// Abort the transaction in case of an error
		await session.abortTransaction();
		session.endSession();

		res.status(500).json({ error: true, msg: "Server error" });
	}
};
// Controller to delete a tester from AcceptedProject and assign a new one with a session
const updateAcceptedProjectTester = async (req, res) => {
	const { projectId, testerId, newTesterId } = req.body;
	// Start a session
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		// Find and delete the AcceptedProject entry with the specified testerId and projectId
		const deletedTester = await AcceptedProject.findOneAndDelete(
			{ project: projectId, tester: testerId },
			{ session }
		);
		const project = await Project.findById(projectId).session(session);
		if (!project) {
			await session.abortTransaction();
			session.endSession();
			return res.status(404).json({ error: true, msg: "Project not found" });
		}
		// Check if the tester exists in the list
		const newTesterIndex = project.testers.indexOf(newTesterId);
		if (newTesterIndex === 0) {
			// Remove the newtester from the list
			project.testers.splice(newTesterIndex, 1);
		}

		if (!deletedTester) {
			await session.abortTransaction();
			session.endSession();
			return res
				.status(404)
				.json({ error: true, msg: "Tester not found for this project" });
		}
		if (deletedTester.status_of_test === "completed") {
			await session.abortTransaction();
			session.endSession();
			return res.status(404).json({
				error: true,
				msg: "You cannot change tester, project is completed",
			});
		}

		// If a new tester is provided, create a new AcceptedProject entry for the new tester
		if (newTesterId) {
			// Check if the new tester exists
			const newTester = await User.findOne({
				_id: newTesterId,
				verified: true,
				is_tester: true,
			}).session(session);
			if (!newTester) {
				await session.abortTransaction();
				session.endSession();
				return res.status(404).json({
					error: true,
					msg: "New tester is not verified or not a tester",
				});
			}

			// Create a new AcceptedProject entry for the new tester with "not started" status
			const newAcceptedProject = new AcceptedProject({
				tester: newTesterId,
				project: projectId,
				confirmationDate: new Date(),
				status_of_test: "in progress",
			});

			await newAcceptedProject.save({ session });
			await sendGmailAddressToTester(newTester.email, project);
			await project.save({ session });
			newTester.fcm_token.forEach(async (token) => {
				await sendNotification(
					token,
					`You have been assigned to the app test: ${project.name}`,
					`Code of app: ${project.code}`
				);
			});
		}

		// Commit the transaction
		await session.commitTransaction();
		session.endSession();

		res.status(200).json({
			error: false,
			msg: "Tester updated successfully",
			projectId,
			removedTesterId: testerId,
			addedTesterId: newTesterId || null,
		});
	} catch (error) {
		console.error("Error updating tester:", error);

		// Abort the transaction in case of an error
		await session.abortTransaction();
		session.endSession();

		res.status(500).json({ error: true, msg: "Server error" });
	}
};
//Controller to Add tester to list of selected
const addTesterToSelectedList = async (req, res) => {
	const { projectId, testerId } = req.body;
	// Validation des entrées
	if (!projectId || !testerId) {
		return res
			.status(400)
			.json({ error: true, msg: "Project ID and Tester ID are required" });
	}

	try {
		// Trouver le projet par son ID
		const project = await Project.findById(projectId);
		if (!project) {
			return res.status(404).json({ error: true, msg: "Project not found" });
		}

		// Vérifier si le testeur existe
		const tester = await User.findById(testerId);
		if (!tester) {
			return res.status(404).json({ error: true, msg: "Tester not found" });
		}

		// Vérifier si le testeur est déjà dans la liste des testeurs
		if (project.testers.includes(testerId)) {
			return res
				.status(400)
				.json({ error: true, msg: "Tester already added to this project" });
		}
		// Ajouter le testeur à la liste des testeurs du projet
		project.testers.push(testerId);

		// Incrémenter le nombre de testeurs
		project.nb_tester = project.testers.length;
		// Sauvegarder le projet mis à jour
		await project.save();
		await sendGmailAddressToTester(tester.email, project);
		return res.status(200).json({
			error: false,
			msg: "Tester added successfully",
			project: project,
		});
	} catch (error) {
		console.error(error);
		return res.status(500).json({
			error: true,
			msg: "An error occurred while adding the tester to the project",
		});
	}
};
module.exports = {
	getListsPreferences,
	getTestersCount,
	createProjectAndPayWithCash,
	listProjectsByTester,
	testerDeclineProject,
	testerAcceptProject,
	getTesterAcceptedProjects,
	countTesterAcceptedProjects,
	countUserProjects,
	getAllUserProjects,
	countTesterAssignedProject,
	deleteProject,
	createProjectAndPayWithWallet,
	getAllProjects,
	getProjectDetails,
	validateCashPayment,
	getCurrentCommission,
	updateCurrentCommission,
	completeTestAndDistributePayments,
	updateTesterList,
	updateAcceptedProjectTester,
	addTesterToSelectedList,
};
