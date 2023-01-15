const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
	user: mongoose.ObjectId,
	pictureUrl: String,
	basics: {
		fullName: String,
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		username: { type: String, required: true },
		jobTitle: String,
		label: String,
		picture: String,
		email: String,
		phone: String,
		summary: String,
		location: {
			address: String,
			postalCode: String,
			city: String,
			countryCode: String,
			region: String,
		},
	},
	contacts: [
		{
			user: mongoose.ObjectId,
			fullName: String,
			username: String,
			jobTitle: String,
			pictureUrl: String,
		},
	],
	projects: [
		{
			projectName: String,
			link: String,
			tools: [String],
			description: String,
		},
	],
	websites: [{ website: String }],
	profiles: [
		{
			network: String,
			username: String,
			url: String,
		},
	],
	work: [
		{
			company: String,
			position: String,
			priority: String,
			website: String,
			startDate: String,
			endDate: String,
		},
	],
	volunteer: [
		{
			organization: String,
			position: String,
			website: String,
			startDate: String,
			endDate: String,
			summary: String,
		},
	],
	education: [
		{
			institution: String,
			area: String,
			studyType: String,
			startDate: String,
			endDate: String,
		},
	],
	awards: [
		{
			award: String,
			awarder: String,
			date: String,
			website: String,
			summary: String,
		},
	],
	publications: [
		{
			title: String,
			publisher: String,
			releaseDate: String,
			website: String,
			summary: String,
		},
	],
	skills: [String],
	languages: [
		{
			language: String,
			fluency: String,
		},
	],
	interests: [
		{
			interest: String,
			keywords: [String],
		},
	],
	references: [
		{
			name: String,
			phone: String,
			email: String,
			website: String,
		},
	],
});

const Profile = mongoose.model('profile', ProfileSchema);
module.exports = Profile;
