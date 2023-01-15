require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
	// Get token from header
	const token = req.header('x-auth-token');

	// Check if no token
	if (!token) {
		return res.status(401).json({ msg: 'No token, authorization denied' });
	}

	try {
		// Decode token
		const jwtSecert = process.env.JWT_SECERET;
		const decoded = jwt.verify(token, jwtSecert);

		// add user field to request body
		req.user = decoded.user;

		// Move on to next middleware
		next();
	} catch (err) {
		res.status(401).json({ msg: 'Invalid token, authorization denied' });
	}
};
