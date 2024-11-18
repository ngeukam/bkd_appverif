const nodemailer = require("nodemailer");

// Function to capitalize project name
function capitalizeProjectName (name) {
    return name
      .split(' ')               // Split by spaces
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toUpperCase()) // Capitalize each word
      .join(' ');               // Join them back into a single string
  };
  // Function to format the date (extracting only the date part)
function formatDate (dateString) {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];  // Extracts 'YYYY-MM-DD' format
  };
function sendGmailAddressToTester(testerEmail, project) {
	const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invitation to Test Application</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
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
          color: #4CAF50;
          text-align: center;
        }
        p {
          font-size: 16px;
          color: #555;
        }
        .button {
        display: inline-block;
        background-color: #fff;
        color: #007bff;
        font-size: 16px;
        font-weight: bold;
        padding: 10px 20px;
        text-align: center;
        text-decoration: none;
        border: 2px solid #007bff;
        border-radius: 4px;
        margin-top: 20px;
        transition: background-color 0.3s, color 0.3s;
    }

    .button:hover {
      background-color: #007bff;
      color: #fff;
    }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>You're Invited to Test the Application!</h1>
        <p>Dear User,</p>
        <p>Congratulations! You have been invited to test the <strong>${capitalizeProjectName(project.name)}</strong> application.</p>
        <p>App Code: <strong>${project.code}</strong></p>
        <p>To accept the invitation, simply click the link below. You have until <strong>${formatDate(project.start_date)}</strong> to accept:</p>
        <a href="${process.env.FRONTEND_URL}/user/invitations-to-tests" class="button">Accept Invitation</a>
        <p>If you have any issues or questions, feel free to reach out to us at <a href="mailto:contact@appverif.com">contact@appverif.com</a>.</p>
        <p>Best regards,<br>Your Development Team</p>
      </div>
    </body>
    </html>
  `;
	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: testerEmail,
		subject: "Invitation to Test the Application",
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
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return res.status(500).send("Error sending email: " + error);
		}
		res.status(200).send("Email sent successfully: " + info.response);
	});
}
function sendGmailAddressToOwner(ownerEmail, project) {
	const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Completion Notification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
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
        .highlight {
          color: #007bff;
          font-weight: bold;
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
        <h1>Test Completed - All Testers Paid!</h1>
        <p>Dear User,</p>
        <p>We are pleased to inform you that the testing for your project <span class="highlight">${capitalizeProjectName(project.name)}</span> 
        (Code: <span class="highlight">${project.code}</span>) has been successfully completed.</p>
        <p>All testers have completed their tasks, and the payments for their work have been processed.</p>
        <p>Thank you for using our testing platform!</p>
        
        <div class="footer">
          <p>Best regards,<br>Your Testing Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: ownerEmail,
		subject: "Test Completed - All Testers Paid",
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
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return res.status(500).send("Error sending email: " + error);
		}
		res.status(200).send("Email sent successfully: " + info.response);
	});
}
function sendGmailAddressToConfirmPayTesters(
	ownerEmail,
	project,
	paymentPerTester
) {
	const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Test Completion and Payment Notification</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
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
        .highlight {
          color: #007bff;
          font-weight: bold;
        }
        .payment {
          color: #28a745;
          font-weight: bold;
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
        <h1>Test Completed & Payment Received</h1>
        <p>Dear Tester,</p>
        <p>We are pleased to inform you that the test for the project <span class="highlight">${capitalizeProjectName(project.name)}</span> (Code: <span class="highlight">${project.code}</span>) has been successfully completed.</p>
        <p>You have been paid <span class="payment">$${paymentPerTester}</span> for completing the test.</p>
        <p>Thank you for your hard work and dedication to the project!</p>
        
        <div class="footer">
          <p>Best regards,<br>Your Testing Team</p>
        </div>
      </div>
    </body>
    </html>
  `;
	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: ownerEmail,
		subject: "Test Completed & Payment Received",
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
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return res.status(500).send("Error sending email: " + error);
		}
		res.status(200).send("Email sent successfully: " + info.response);
	});
}
function sendGmailToAdmin(project) {
	const mailOptions = {
		from: process.env.EMAIL_USER, // Sender address
		to: process.env.ADMIN_EMAIL, // Admin email address
		subject: "New App Added: " + project.name, // Subject of the email
		html: `
          <h1>New App Added</h1>
          <p>A new app has been added to your platform:</p>
          <p><strong>App Name:</strong> ${capitalizeProjectName(project.name)}</p>
          <p><strong>App Code:</strong> ${project.code}</p>
          <p><strong>Description:</strong> ${project.description}</p>
          <p>To manage this app, you can visit the admin panel.</p>
        `, // HTML body content
	};
	const transporter = nodemailer.createTransport({
		service: "gmail",
		auth: {
			user: process.env.EMAIL_USER,
			pass: process.env.EMAIL_PASS,
		},
	});
	// Envoyer l'e-mail
	transporter.sendMail(mailOptions, (error, info) => {
		if (error) {
			return res.status(500).send("Error sending email: " + error);
		}
		res.status(200).send("Email sent successfully: " + info.response);
	});
}
module.exports = {
	sendGmailAddressToConfirmPayTesters,
	sendGmailAddressToOwner,
	sendGmailAddressToTester,
	sendGmailToAdmin,
};
