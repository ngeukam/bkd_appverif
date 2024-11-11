const jwt = require('jsonwebtoken');
const User = require('../models/user.model'); // Corriger l'import de User

const secret = process.env.JWT_SECRET;

// Middleware pour décoder le token
const decodeToken = (req, res, next) => {
	try {
		const token = req.headers?.authorization?.split(" ")[1];
		res.locals.user = jwt.verify(token, secret);
		next();
	} catch (err) {
		next();
	}
};

// Middleware d'autorisation utilisateur
const userAuth = ({
	permission = "",
	isAdmin = false,
	isUser = false,
	isAuth = false,
}) => async (req, res, next) => {
	try {
		const token = req.headers?.authorization?.split(" ")[1];
		let decode = jwt.verify(token, secret);
		let user = await User.findById(decode._id, "role permission").populate(
			"permission"
		);
		res.locals.user = user;
		const userRoles = ["admin", "user", "employee"];
		if (isAdmin && user.role === "admin") {
			next();
			return;
		} else if (isUser && user.role === "user") {
			next();
			return;
		} else if (userRoles.includes(user.role) && isAuth) {
			next();
			return;
		} else if (havePermission(permission, user.permission)) {
			next();
			return;
		}
		return res.status(401).send({
			error: true,
			msg: "Unauthorized access",
		});
	} catch (err) {
		return res.status(401).send({
			error: true,
			msg: "Unauthorized access",
		});
	}
};

// Vérifier si c'est une requête de démo
const isDemoRequest = async (req, res, next) => {
	try {
		const isDemo = process.env.PRODUCT_MODE;
		if (isDemo === "demo") {
			return res.status(401).send({
				error: true,
				msg: "Demo request rejected",
			});
		}
		next();
		return;
	} catch (err) {
		return res.status(401).send({
			error: true,
			msg: "Unauthorized access",
		});
	}
};

// Vérifier les permissions
const havePermission = (permission, roles) => {
	for (let role of roles || []) {
		if (role.permissions.includes(permission)) {
			return true;
		}
	}
	return false;
};

// Exporter les fonctions avec CommonJS
module.exports = {
	decodeToken,
	userAuth,
	isDemoRequest,
	havePermission,
};
