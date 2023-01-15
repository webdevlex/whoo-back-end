const mongoose = require('mongoose');

const ThreadSchema = new mongoose.Schema({
	members: [mongoose.ObjectId],
	memberProfiles: [
		{
			user: mongoose.ObjectId,
			username: String,
			fullName: String,
			jobTitle: String,
			pictureUrl: String,
		},
	],
	messages: [
		{
			from: mongoose.ObjectId,
			message: String,
			timeSent: Number,
			fullName: String,
			username: String,
		},
	],
	lastUpdated: Number,
});

const Thread = mongoose.model('thread', ThreadSchema);
module.exports = Thread;
