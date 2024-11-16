const User = require("../models/user.model");
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;
const { getAuth } = require("firebase-admin/auth");
const firebaseAdmin = require("../utils/firebase");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

// Configurer le transporteur d'e-mails
const sendConfirmationEmail = async (user, secret) => {
  // Générer le token de confirmation
  const confirmationToken = jwt.sign({ _id: user?._id }, secret, {
    expiresIn: "1h",
  });
  user.confirmationToken = confirmationToken; // Assigner le token à l’utilisateur
  // Créer le lien de confirmation
  const confirmLink = `${process.env.FRONTEND_URL}/user/confirm-email?auth_type=web&token=${confirmationToken}`;
  // Définir les options de l'e-mail
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirm your registration</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #28a745;
          text-align: center;
        }
        p {
          font-size: 16px;
          color: #555;
        }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: #fff;
          font-size: 16px;
          font-weight: bold;
          padding: 10px 20px;
          text-align: center;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 20px;
          transition: background-color 0.3s, color 0.3s;
        }
        .button:hover {
          background-color: #0056b3;
          color: #fff;
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #777;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Confirm Your Registration</h1>
        <p>Dear User,</p>
        <p>Thank you for registering with us! To complete your registration, please confirm your email address by clicking on the link below:</p>
        
        <a href="${confirmLink}" class="button">Confirm Registration</a>

        <p><strong>Note:</strong> This link will expire in 1 hour. If you didn't request this registration, please ignore this email.</p>

        <div class="footer">
          <p>Best regards,<br>Your Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Confirm your registration",
    html: htmlContent,
  };
  // Configurer le transporteur pour envoyer l’e-mail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  // Envoyer l'e-mail
  await transporter.sendMail(mailOptions);
  return confirmationToken;
};
const sendConfirmationResetPass = async (user, secret) => {
  // Générer le token de confirmation
  const confirmationToken = jwt.sign({ _id: user?._id }, secret, {
    expiresIn: "1h",
  });
  user.confirmationToken = confirmationToken; // Assigner le token à l’utilisateur
  // Créer le lien de confirmation
  const confirmLink = `${process.env.FRONTEND_URL}/auth/change-password?token=${confirmationToken}`;
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Change Your Password</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          margin: 0;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #fff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
          color: #28a745;
          text-align: center;
        }
        p {
          font-size: 16px;
          color: #555;
        }
        .button {
          display: inline-block;
          background-color: #007bff;
          color: #fff;
          font-size: 16px;
          font-weight: bold;
          padding: 10px 20px;
          text-align: center;
          text-decoration: none;
          border-radius: 4px;
          margin-top: 20px;
          transition: background-color 0.3s, color 0.3s;
        }
        .button:hover {
          background-color: #0056b3;
          color: #fff;
        }
        .footer {
          margin-top: 30px;
          font-size: 14px;
          color: #777;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Change Your Password</h1>
        <p>Dear User,</p>
        <p>We received a request to change your password. To proceed, please click the link below:</p>
        
        <a href="${confirmLink}" class="button">Change Your Password</a>

        <p><strong>Note:</strong> This link will expire in 1 hour. If you did not request a password change, please ignore this email.</p>

        <div class="footer">
          <p>Best regards,<br>Your Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
  // Définir les options de l'e-mail
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Change Your Password",
    html: htmlContent,
  };
  // Configurer le transporteur pour envoyer l’e-mail
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  // Envoyer l'e-mail
  await transporter.sendMail(mailOptions);
  return confirmationToken;
};
// User signup
const userRegistration = async (req, res) => {
  try {
    let { body } = req;
    const exitUser = await User.findOne({ email: body.email });
    if (!!exitUser) {
      return res.status(400).send({
        error: true,
        msg: "An account with this credential has already existed",
      });
    }

    let hashedPassword;
    if (body.password) {
      hashedPassword = await bcrypt.hash(body.password, 8);
    }

    let user = new User({
      email: body.email,
      password: hashedPassword,
      role: body.role,
      verified: false,
    });
    // Generate a confirmation token
    const confirmationToken = await sendConfirmationEmail(user, secret);
    user.confirmationToken = confirmationToken;
    await user.save();
    await User.findByIdAndUpdate(user?._id, {
      $addToSet: { fcm_token: body.fcm_token },
    });
    // let token = jwt.sign({ _id: user?._id }, secret, { expiresIn: "15 d" });
    return res.status(200).send({
      error: false,
      msg:
        "Please check your email and confirm your registration by clicking the link",
    });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(406).send({
        error: true,
        msg: "An account with this credential has already existed",
      });
    }
    return res.status(500).send({
      error: true,
      msg: "Server failed",
    });
  }
};
//User confirm Email
const confirmEmail = async (req, res) => {
  const { token } = req.body;
  try {
    if (!token) {
      return res.status(400).json({ msg: "Token is required" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === "TokenExpiredError") {
        return res.status(400).json({
          msg: "Token has expired, please request a new verification email.",
          error: true,
        });
      }
      return res.status(500).json({
        msg: "Failed to confirm email, an unexpected error occurred",
        error: true,
      });
    }

    const user = await User.findOne({
      _id: decoded._id,
    });

    if (!user) {
      return res.status(400).json({
        msg: "User not found or expired token",
        error: true,
      });
    }
    if (user.verified) {
      return res.status(400).json({ msg: "Your email is already verified." });
    }
    user.verified = true;
    user.confirmationToken = null;
    await user.save();
    return res.status(200).json({
      msg: "Email confirmed successfully; You can Log in",
      error: false,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      error: true,
      msg: "Failed to confirm email, an unexpected error occurred",
    });
  }
};

//User Login
const userLogin = async (req, res) => {
  let { body } = req;
  try {
    if (body.username && body.password) {
      const email = body?.username?.trim().toLowerCase();
      const user = await User.findOne({
        $or: [{ email }, { phone: body.username }],
      });

      if (user?.verified === false) {
        const confirmationToken = await sendConfirmationEmail(user, secret);
        user.confirmationToken = confirmationToken;
        await user.save(); // Sauvegardez le token dans la base de données
        return res.status(403).json({
          error: true,
          msg:
            "Your account is not verified. A verification email has been sent.",
        });
      }
      if (!user?.password) {
        return res.status(403).json({
          error: true,
          msg: "Wrong credentials",
        });
      }
      // Rechercher l'utilisateur basé sur l'email ou le téléphone
      if (user) {
        // Vérifiez le mot de passe
        let isPasswordValid = await bcrypt.compare(
          body.password,
          user.password
        );
        if (isPasswordValid) {
          user.password = undefined;
          await User.findByIdAndUpdate(user?._id, {
            $addToSet: { fcm_token: body.fcm_token },
          });
          let token = jwt.sign({ _id: user._id }, secret, {
            expiresIn: "15d",
          });
          return res.status(200).send({
            error: false,
            msg: "Login successful",
            token,
            data: {
              _id: user?._id,
              name: user?.name,
              email: user?.email,
              role: user?.role,
              verified: user?.verified,
              is_tester: user?.is_tester,
            },
          });
        } else {
          return res
            .status(401)
            .json({ error: true, msg: "Invalid credentials" });
        }
      } else {
        return res.status(404).json({ msg: "User not found" });
      }
    } else {
      return res.status(404).json({
        error: true,
        msg: "Wrong credentials",
      });
    }
  } catch (error) {
    return res.status(500).send({
      error: true,
      msg: "Server failed ",
    });
  }
};
//User Social Login
const userSocialLogin = async (req, res) => {
  try {
    let { body } = req;
    let decodedToken = await getAuth(firebaseAdmin).verifyIdToken(
      body?.idToken
    );
    let user = await User.findOne({ email: decodedToken?.email });
    if (!user) {
      user = new User({
        name: decodedToken.name,
        email: decodedToken.email?.toLowerCase(),
        image: decodedToken.picture,
        role: body.role,
        verified: true,
      });
      await user.save();
    }
    let token = jwt.sign({ _id: user?._id }, secret, { expiresIn: "15d" });
    await User.findByIdAndUpdate(user?._id, {
      $addToSet: { fcm_token: body.fcm_token },
    });
    return res.status(200).send({
      error: false,
      msg: "Login successful",
      token,
      data: {
        _id: user?._id,
        name: user?.name,
        email: user?.email,
        verified: user?.verified,
        auth_type: body.auth_type,
        is_tester: user?.is_tester,
      },
    });
  } catch (e) {
    return res.status(500).send({
      error: true,
      msg: "Login failed! Try again",
    });
  }
};

const userVerifyByEmail = async (req, res) => {
  try {
    const { query } = req;
    // Vérification si l'email existe et le convertit en minuscule
    const email = query?.username?.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({
        error: true,
        data: "Invalid email address",
      });
    }
    // Cherche l'utilisateur par email
    const isExist = await User.findOne({
      email: query?.username?.toLowerCase(),
    });
    if (!isExist) {
      return res.status(403).json({
        error: true,
        data: "Please sign up first",
      });
    }

    // Si l'utilisateur est trouvé
    return res.status(200).json({
      error: false,
      data: "Login success",
    });
  } catch (e) {
    // Gérer les erreurs côté serveur
    return res.status(500).json({
      error: true,
      data: "Server side error",
    });
  }
};

const userUpdateByToken = async (req, res) => {
  try {
    const { _id } = res.locals.user || {}; // Authenticated user's ID
    const { body } = req; // Request body
    if (!_id) {
      return res.status(401).send({ error: true, msg: "Unauthorized action" });
    }

    // Retrieve the current user
    let user = await User.findById(_id);
    if (!user) {
      return res.status(404).send({ error: true, msg: "User not found" });
    }

    // Flag to indicate if a duplicate phone number was found
    let phoneDuplicate = false;

    // Check if a phone number is provided and already exists for another user
    if (body.phone) {
      const existingUser = await User.findOne({ phone: body.phone });
      if (existingUser && existingUser._id.toString() !== _id) {
        // Set the duplicate flag to true, but continue with the update
        phoneDuplicate = true;
        delete body.phone;
      }
    }

    // Ensure password is not updated
    delete body.password;

    // Perform the update for all other fields
    await User.updateOne({ _id }, { $set: { ...body } });

    // Send a response based on the phone duplication check
    return res.status(200).send({
      error: false,
      msg: phoneDuplicate
        ? "Phone number already exists, but other fields were updated."
        : "Successfully updated",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).send({ error: true, msg: "Server error" });
  }
};

const userDetails = async (req, res) => {
  try {
    const { query } = req;
    let data = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(query._id),
          role: "user",
        },
      },
      {
        $project: {
          password: 0,
        },
      },
    ]);
    return res.status(200).send({
      error: false,
      msg: "Success",
      data: data[0],
    });
  } catch (e) {
    return res.status(500).send({
      error: true,
      msg: "Server failed",
    });
  }
};

const checkEmailExistRequestToken = async (req, res) => {
  const { body } = req;
  try {
    let user = await User.findOne({ email: body.email });
    if (!user) {
      return res
        .status(400)
        .send({ error: true, msg: "No user found with that email" });
    }
    const resetPasswordToken = await sendConfirmationResetPass(user, secret);
    user.resetPasswordToken = resetPasswordToken;
    await user.save();
    return res.status(200).send({
      error: false,
      msg: "Password reset link has been sent to your email",
    });
  } catch (e) {
    return res.status(500).send({
      error: true,
      msg: "Server failed",
    });
  }
};

const changePasswordRequest = async (req, res) => {
  const { token, newPassword, confirmPassword } = req.body;
  if (newPassword !== confirmPassword) {
    return res.status(400).send({ error: true, msg: "Passwords do not match" });
  }
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
    });

    if (!user) {
      return res
        .status(400)
        .send({ error: true, msg: "Invalid or expired token" });
    }
    user.password = await bcrypt.hash(newPassword, 8);
    user.resetPasswordToken = undefined;
    await user.save();
    return res.status(200).send({
      error: false,
      msg: "Successfully updated",
    });
  } catch (e) {
    console.log(e);
    return res.status(500).send({
      error: true,
      msg: "Server failed",
    });
  }
};

const getLoginUserDataByToken = async (req, res) => {
  try {
    const { user } = res.locals;
    if (!user?._id) {
      return res.status(403).json({
        error: true,
        msg: "Permission denied",
      });
    }

    const userInfo = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(user?._id) } },
      {
        $project: {
          password: 0,
          active: 0,
          fcm_token: 0,
          __v: 0,
          updatedAt: 0,
          createdAt: 0,
        },
      },
    ]);
    if (!user) {
      return res.status(400).json({
        error: true,
        msg: "Not Found",
      });
    }
    return res.status(200).json({
      error: false,
      data: userInfo[0],
    });
  } catch (e) {
    return res.status(200).json({
      error: true,
      data: "Server side error",
    });
  }
};
//**Admin*** *//
const getUsersWithWalletAmounts = async (req, res) => {
  try {
    const { query } = req;
    const { user } = res.locals;
    let filter = {};

    // Filtre de recherche si un paramètre "search" est fourni
    if (query.search) {
      filter = {
        $or: [
          { name: { $regex: new RegExp(query.search, "i") } },
          { email: { $regex: new RegExp(query.search, "i") } },
        ],
      };
    }

    // Limiter l'accès aux utilisateurs si nécessaire (par exemple, si l'utilisateur n'est pas admin)
    if (user && user.role !== "admin") {
      filter._id = new mongoose.Types.ObjectId(user._id);
    }

    // Agrégation avec pagination
    const usersWithWallets = await User.aggregatePaginate(
      User.aggregate([
        { $match: filter },

        // Jointure avec la collection Wallet pour obtenir tous les montants associés à chaque utilisateur
        {
          $lookup: {
            from: "wallets",
            localField: "_id",
            foreignField: "user",
            as: "wallets",
          },
        },

        // Calcul de la somme des montants des portefeuilles
        {
          $addFields: {
            totalWalletAmount: {
              $sum: "$wallets.amount",
            },
          },
        },

        // Projection des champs souhaités
        {
          $project: {
            _id: 1,
            email: 1,
            age_ranges: 1,
            phone_types: 1,
            is_tester: 1,
            business_types: 1,
            country: 1,
            verified: 1,
            totalWalletAmount: 1,
            role: 1,
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
      data: usersWithWallets,
    });
  } catch (error) {
    console.error(
      "Error retrieving users with the sum of their wallets:",
      error
    );
    return res.status(500).json({
      error: true,
      msg: error.message,
    });
  }
};

const getUserDetailsWithWallet = async (req, res) => {
  try {
    const { user } = res.locals;
    const { _id } = req.query;
    // Construct filter object for the query if needed
    let filter = {};

    // If the user is not an admin, you may want to restrict access
    if (user && user.role !== "admin") {
      filter._id = new mongoose.Types.ObjectId(user._id);
    }

    // Aggregate query to join Users with their Wallet data and sum the Wallet amounts
    const usersDetails = await User.aggregate([
      // Match users based on the filter
      {
        $match: {
          _id: new mongoose.Types.ObjectId(_id),
        },
      },

      // Join with the Wallet collection to get the wallet amounts
      {
        $lookup: {
          from: "wallets", // Wallet collection
          localField: "_id", // Match the user ID with the wallet's user field
          foreignField: "user", // Reference the "user" field in Wallet
          as: "wallets", // Alias for the matched wallets
        },
      },

      // Add the total wallet amount by summing the amounts from the "wallets" array
      {
        $addFields: {
          totalWalletAmount: {
            $sum: "$wallets.amount", // Sum of the wallet amounts for each user
          },
        },
      },

      // Project the desired user fields and the calculated wallet amount
      {
        $project: {
          _id: 1,
          email: 1,
          age_ranges: 1,
          phone_types: 1,
          is_tester: 1,
          business_types: 1,
          country: 1,
          verified: 1,
          totalWalletAmount: 1,
          role: 1,
          createdAt: 1,
        },
      },
    ]);

    return res.status(200).json({
      error: false,
      data: usersDetails[0],
    });
  } catch (error) {
    return res.status(500).json({
      error: true,
      msg: error.message,
    });
  }
};
module.exports = {
  userSocialLogin,
  userVerifyByEmail,
  userUpdateByToken,
  userDetails,
  getLoginUserDataByToken,
  userRegistration,
  confirmEmail,
  userLogin,
  checkEmailExistRequestToken,
  changePasswordRequest,
  getUsersWithWalletAmounts,
  getUserDetailsWithWallet,
};
