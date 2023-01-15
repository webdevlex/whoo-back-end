const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// @route    Get api/auth
// @desc     Check if user autherized
// @access   Public
router.get('/', auth, async (req, res) => {
	try {
		const user = await User.findById(req.user.id).select('-password');
		res.json(user);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

// @route    Post api/users
// @desc     Login user
// @access   Public
router.post(
	'/',
	[
		check('email').isEmail().withMessage('Invalid email and password'),
		check('password').exists().withMessage('Invalid email and password'),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { email, password } = req.body;

		try {
			const user = await User.findOne({ email: email });
			if (!user) {
				return res
					.status(400)
					.json({ errors: [{ msg: 'Invalid email and password' }] });
			}

			const isMatch = await bcrypt.compare(password, user.password);
			if (!isMatch) {
				return res
					.status(400)
					.json({ errors: [{ msg: 'Invalid email and password' }] });
			}

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
			res.status(500).send({ errors: [{ msg: 'Server Error' }] });
		}
	}
);

module.exports = router;
