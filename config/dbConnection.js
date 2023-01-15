const mongoose = require('mongoose');
const config = require('config');
// const db = config.get('mongoURI');
const uri = process.env.MONGODB_URI || config.get('mongoURI');

const connectDB = async () => {
	try {
		await mongoose.connect(uri, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});
		console.log('MongoDB successfully connected...');
	} catch (err) {
		console.log('MongoDB failed to connect...');
		console.log(err.message);
		// Exit process with failure
		process.exit(1);
	}
};

module.exports = connectDB;
