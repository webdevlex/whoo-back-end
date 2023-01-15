// Import express from modules
const express = require('express');
// Import connected database
const connectDB = require('./config/dbConnection');
// Allow to make requests on diffrent ports
var cors = require('cors');
const path = require('path');

// Initialize express
const app = express();

// Connect MongoDB
connectDB();

// app.use((req, res, next) => {
// 	res.header('Access-Control-Allow-Origin', '*');
// 	next();
// });

// Initilze middleware (allows us to parse request body)
app.use(express.json({ extended: false }));
app.use(cors());

// Define routes in diffrent files
// when someone hits '/api/users' will connect to routes/api/users.js file routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/thread', require('./routes/api/thread'));
app.use('/api/s3', require('./routes/api/s3'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
	// Set static folder
	app.use(express.static('front-end/build'));

	app.get('*', (req, res) => {
		res.sendFile(path.resolve(__dirname, 'front-end', 'build', 'index.html'));
	});
}

// Set port to listen to, process.env.PORT (looking for enviornment variable) if not then 5000
const PORT = process.env.PORT || 5000;

// Intialize port listen on given port
app.listen(PORT, () => console.log(`Server started on port: ${PORT}`));
