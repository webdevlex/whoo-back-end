const express = require('express');
// Used to seperate routes from server.js (have in diffrent files)
const router = express.Router();
// User to check incoming request and validate
const { check, validationResult } = require('express-validator');
// Import user schema
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// @route    Get api/users
// @desc     Register new user
// @access   Public
router.post(
	'/',
	[
		check('email').isEmail().withMessage('Invalid Email'),
		check('password')
			.isLength({ min: 8 })
			.withMessage('Password must be 8 characters long')
			.isLength({ max: 25 })
			.withMessage('Password must be less than 25 characters long')
			.matches(/\d/)
			.withMessage('Password must contain a number')
			.matches(/[.A-Z]/)
			.withMessage('Password must contain an upper case letter')
			.matches(/[.a-z]/)
			.withMessage('Password must contain a lower case letter')
			.matches(/\W|_/)
			.withMessage('Password must contain a special character'),

		check('confirmPassword').custom(async (confirmPassword, { req }) => {
			const password = req.body.password;

			// If password and confirm password not same
			// don't allow to sign up and throw error
			if (password !== confirmPassword) {
				throw new Error('Passwords must be same');
			}
		}),
	],
	async (req, res) => {
		// Intialize errors variable
		const errors = validationResult(req);
		// Check if any errors occured during validation
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		// Pull out fields from body
		const { email, password } = req.body;

		try {
			// See if user exists already
			let user = await User.findOne({ email: email });
			if (user) {
				return res
					.status(400)
					.json({ errors: [{ msg: 'User already exists' }] });
			}

			// Create new user if email is uniqe
			user = new User({
				email: email,
				password: password,
			});

			// Encrypt password
			const salt = await bcrypt.genSalt(10);
			// Create hash version off password
			user.password = await bcrypt.hash(password, salt);

			// Save user in database
			await user.save();

			// Return jsonwebtoken
			const payload = {
				user: {
					id: user.id,
				},
			};

			jwt.sign(
				payload,
				config.get('jwtSeceret'),
				{ expiresIn: 360000 },
				(err, token) => {
					if (err) {
						throw err;
					}
					res.json({ token });
				}
			);
		} catch (err) {
			console.log(err.message);
			res.status(500).json({ errors: [{ msg: 'Server Error' }] });
		}
	}
);

module.exports = router;
