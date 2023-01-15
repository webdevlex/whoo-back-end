const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const Thread = require('../../models/Thread'); // DELETE
const { check, validationResult } = require('express-validator');

const ALLOW_TEST_PROFILE_CHANGES = false;
function testProfile(id) {
	if (ALLOW_TEST_PROFILE_CHANGES) return false;
	return id === '61f091ce9cbbc5dde3a66756';
}

router.post('/updateMessageProfiles', async (req, res) => {
	try {
		const thread = await Thread.findByIdAndUpdate('61f091fc9cbbc5dde3a66794', {
			$set: {
				memberProfiles: [
					{
						user: '61e352500d22e1189a6c92b0',
						username: 'webdevlex',
						fullName: 'Alexis Martin',
						pictureUrl: req.body.url,
						jobTitle: 'Full Stack Web Developer',
					},
					{
						user: '61f091ce9cbbc5dde3a66756',
						username: 'TestAccount',
						fullName: 'Andras Arato',
					},
				],
			},
		});
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

// @route    Get api/profile
// @desc     Get specific profiles
// @access   Public
router.get('/', async (req, res) => {
	try {
		const profile = await Profile.findOne({
			'basics.username': req.query.username,
		});

		if (!profile) {
			return res.status(400).json({ msg: 'There is no profile for this user' });
		}
		res.json(profile);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

// @route    Get api/profile
// @desc     Get specific profiles
// @access   Public
router.get('/search', async (req, res) => {
	const searchString = req.query.search;
	try {
		const regexp = new RegExp(`^${searchString}`);
		const profiles = await Profile.find({
			'basics.fullName': regexp,
		});
		const formattedProfiles = profiles
			.filter(({ basics: { username } }) => username !== 'webdevlex')
			.map(({ basics: { fullName, username, jobTitle }, pictureUrl, user }) => {
				return { fullName, username, jobTitle, pictureUrl, user };
			});

		const myProfile = await Profile.findOne({
			'basics.username': 'webdevlex',
		});

		const defaultResults = [
			{
				fullName: myProfile.basics.fullName,
				username: 'webdevlex',
				jobTitle: myProfile.basics.jobTitle,
				user: myProfile.user.valueOf(),
				pictureUrl: myProfile.pictureUrl,
			},
			...formattedProfiles,
		];

		res.json(defaultResults);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

// @route    Get api/profile
// @desc     Get specific profiles
// @access   Public
router.get('/id', async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.query.id,
		});
		if (!profile) {
			return res.status(400).json({ msg: 'There is no profile for this user' });
		}
		res.json(profile);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

// @route    Get api/profile/me
// @desc     Get my profiles
// @access   Private
router.get('/me', auth, async (req, res) => {
	try {
		const myProfile = await Profile.findOne({ user: req.user.id });
		if (!myProfile) {
			return res.status(400).json({ msg: 'There is no profile for this user' });
		}
		res.json(myProfile);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

// @route    Get api/profile/all
// @desc     Get all profiles
// @access   Public
router.get('/all', async (req, res) => {
	try {
		let all = await Profile.find({});
		return res.json(all);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

// @route    DELETE api/profile
// @desc     Delete current users profile
// @access   private
router.delete('/', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	try {
		await Profile.findOneAndDelete({ user: req.user.id });
		return res.status(200).send('Profile Deleted Successfully');
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

router.post('/add-contact', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	let profileFields = {};
	try {
		const contactProfile = await Profile.findOne({
			'basics.username': req.body.username,
		});

		const {
			basics: { fullName, jobTitle, username },
			pictureUrl,
			user,
		} = contactProfile;

		const newContactInfo = {
			fullName,
			username,
			jobTitle,
			pictureUrl,
			user,
		};

		let profile = await Profile.findOne({ user: req.user.id });
		profileFields.contacts = [...profile.contacts, newContactInfo];
		profile = await Profile.findOneAndUpdate(
			{ user: req.user.id },
			{ $set: profileFields },
			{ new: true }
		);
		res.json(profile);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

router.post('/remove-contact', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	let profileFields = {};
	try {
		let profile = await Profile.findOne({ user: req.user.id });
		profileFields.contacts = profile.contacts.filter(
			({ username }) => username != req.body.username
		);
		profile = await Profile.findOneAndUpdate(
			{ user: req.user.id },
			{ $set: profileFields },
			{ new: true }
		);
		res.json(profile);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

// @route    Post api/profile/picture
// @desc     Create or update user profile
// @access   Private
router.post('/picture', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	let profileFields = req.body;
	try {
		let profile = await Profile.findOne({ user: req.user.id });
		if (profile) {
			profile = await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profileFields },
				{ new: true }
			);
			return res.json(profile);
		}
		profile = new Profile(profileFields);
		await profile.save();
		return res.json(profile);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

// @route    Post api/profile/create
// @desc     Create user profile
// @access   Private
router.post(
	'/create',
	[
		auth,
		[
			check('firstName').not().isEmpty().withMessage('First name required'),
			check('lastName').not().isEmpty().withMessage('Last name required'),
			check('username').not().isEmpty().withMessage('Username required'),
		],
	],
	async (req, res) => {
		// Validate neccessary info
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		// Check if username already exists
		const { firstName, lastName, username } = req.body;

		const profileWithUsername = await Profile.findOne({
			'basics.username': username,
		});

		if (profileWithUsername) {
			return res.status(400).json({ usernameTaken: true });
		}

		const profileFields = {};
		profileFields.user = req.user.id;
		profileFields.basics = {};
		if (firstName && lastName)
			profileFields.basics.fullName = `${firstName} ${lastName}`;
		if (firstName) profileFields.basics.firstName = firstName;
		if (lastName) profileFields.basics.lastName = lastName;
		if (username) profileFields.basics.username = username;

		try {
			let profile = new Profile(profileFields);
			await profile.save();
			return res.json(profile);
		} catch (err) {
			res.status(500).send('Server Error');
		}
	}
);

// @route    Post api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
	'/contact',
	[
		auth,
		[
			check('firstName').not().isEmpty().withMessage('First name required'),
			check('lastName').not().isEmpty().withMessage('Last name required'),
			check('username').not().isEmpty().withMessage('Username required'),
		],
	],
	async (req, res) => {
		if (testProfile(req.user.id)) {
			return res.status(400).json({ testProfile: true });
		}

		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const profileFields = {};

		const {
			firstName,
			lastName,
			username,
			jobTitle,
			email,
			phone,
			address,
			city,
			region,
			postalCode,
			user,
		} = req.body;

		// Check if username already exists
		const profileWithUsername = await Profile.findOne({
			'basics.username': username,
		});
		const thisUsersProfile = profileWithUsername.user.valueOf() === user;

		if (profileWithUsername && !thisUsersProfile) {
			return res.status(400).json({ usernameTaken: true });
		}

		// Build profile object with basics info
		profileFields.user = req.user.id;

		// basics
		profileFields.basics = {};
		if (firstName && lastName)
			profileFields.basics.fullName = `${firstName} ${lastName}`;
		if (firstName) profileFields.basics.firstName = firstName;
		if (lastName) profileFields.basics.lastName = lastName;
		if (username) profileFields.basics.username = username;
		if (jobTitle) profileFields.basics.jobTitle = jobTitle;
		if (email) profileFields.basics.email = email;
		if (phone) profileFields.basics.phone = phone;

		// basics.location
		profileFields.basics.location = {};
		if (address) profileFields.basics.location.address = address;
		if (city) profileFields.basics.location.city = city;
		if (region) profileFields.basics.location.region = region;
		if (postalCode) profileFields.basics.location.postalCode = postalCode;

		try {
			let profile = await Profile.findOne({ user: req.user.id });

			if (profile) {
				// If profile exists already then update
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				);
				return res.json(profile);
			}

			// Create new profile
			profile = new Profile(profileFields);
			await profile.save();
			return res.json(profile);
		} catch (err) {
			res.status(500).send('Server Error');
		}
	}
);

router.post('/projects', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	let profileFields = { projects: [] };

	const values = Object.values(req.body);

	for (let i = 0; i < 3; ++i) {
		const projectName = values[i];
		const link = values[i + 3];
		let tools = values[i + 6];
		const description = values[i + 9];

		if (tools.search(',') > 0) {
			const splitArray = tools.split(',').map((tool) => tool.trim());
			tools = [...new Set(splitArray)];
		} else if (tools.length > 0) {
			tools = [tools];
		}

		if (projectName) {
			profileFields.projects.push({
				projectName,
				link,
				tools,
				description,
			});
		}
	}

	try {
		let profile = await Profile.findOne({ user: req.user.id });
		if (profile) {
			let profile = await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profileFields },
				{ new: true }
			);
			return res.json(profile);
		}

		profile = new Profile(profileFields);
		await profile.save();
		return res.json(profile);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

router.post('/socials', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	let profileFields = { websites: [], profiles: [] };
	const values = Object.values(req.body);

	for (let i = 0; i < 4; ++i) {
		const website = values[i];

		if (website) {
			profileFields.websites.push({ website });
		}
	}

	for (let i = 4; i < values.length; i += 3) {
		const network = values[i];
		const username = values[i + 1];
		const url = values[i + 2];

		if (network) {
			profileFields.profiles.push({
				network,
				username,
				url,
			});
		}
	}

	try {
		if (testProfile(req.user.id)) {
			return;
		}

		let profile = await Profile.findOne({ user: req.user.id });
		if (profile) {
			profile = await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profileFields },
				{ new: true }
			);
			return res.json(profile);
		}

		profile = new Profile(profileFields);
		await profile.save();
		return res.json(profile);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

router.post('/interests', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	let profileFields = { interests: [] };
	const values = Object.values(req.body);

	for (let i = 0; i < values.length; i += 2) {
		const interest = values[i];
		const keywordsArray = values[i + 1];

		if (interest) {
			profileFields.interests.push({
				interest,
				keywords: keywordsArray.split(',').map((skill) => skill.trim()),
			});
		}
	}

	try {
		let profile = await Profile.findOne({ user: req.user.id });
		if (profile) {
			profile = await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profileFields },
				{ new: true }
			);
			return res.json(profile);
		}

		profile = new Profile(profileFields);
		await profile.save();
		return res.json(profile);
	} catch (err) {
		res.status(500).send('Server Errror');
	}
});

router.post('/awards', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	let profileFields = { awards: [] };
	const values = Object.values(req.body);

	for (let i = 0; i < values.length; i += 5) {
		const award = values[i];
		const awarder = values[i + 1];
		const date = values[i + 2];
		const website = values[i + 3];
		const summary = values[i + 4];

		if (award) {
			profileFields.awards.push({
				award,
				awarder,
				date,
				website,
				summary,
			});
		}
	}

	try {
		let profile = await Profile.findOne({ user: req.user.id });

		if (profile) {
			profile = await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profileFields },
				{ new: true }
			);
			return res.json(profile);
		}

		profile = new Profile(profileFields);
		await profile.save();
		return res.json(profile);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

router.post('/publications', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	let profileFields = { publications: [] };
	const values = Object.values(req.body);

	for (let i = 0; i < 3; ++i) {
		const title = values[i];
		const publisher = values[i + 3];
		const releaseDate = values[i + 6];
		const website = values[i + 9];
		const summary = values[i + 12];

		if (title) {
			profileFields.publications.push({
				title,
				publisher,
				releaseDate,
				website,
				summary,
			});
		}
	}

	try {
		let profile = await Profile.findOne({ user: req.user.id });
		if (profile) {
			profile = await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profileFields },
				{ new: true }
			);
			return res.json(profile);
		}

		profile = new Profile(profileFields);
		await profile.save();
		return res.json(profile);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

router.post('/volunteer', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	let profileFields = { volunteer: [] };
	const values = Object.values(req.body);

	for (let i = 0; i < 3; ++i) {
		const organization = values[i];
		const position = values[i + 3];
		const startDate = values[i + 6];
		const endDate = values[i + 9];
		const website = values[i + 12];
		const summary = values[i + 15];

		if (organization) {
			profileFields.volunteer.push({
				organization,
				position,
				startDate,
				endDate,
				website,
				summary,
			});
		}
	}

	try {
		let profile = await Profile.findOne({ user: req.user.id });
		if (profile) {
			profile = await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profileFields },
				{ new: true }
			);
			return res.json(profile);
		}

		profile = new Profile(profileFields);
		await profile.save();
		return res.json(profile);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

router.post('/references', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	let profileFields = { references: [] };
	const values = Object.values(req.body);
	console.log(req.body);

	for (let i = 0; i < 3; ++i) {
		const name = values[i];
		const phone = values[i + 3];
		const email = values[i + 6];
		const website = values[i + 9];

		if (name) {
			profileFields.references.push({
				name,
				phone,
				email,
				website,
			});
		}
	}

	try {
		let profile = await Profile.findOne({ user: req.user.id });
		if (profile) {
			profile = await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profileFields },
				{ new: true }
			);
			return res.json(profile);
		}

		profile = new Profile(profileFields);
		await profile.save();
		return res.json(profile);
	} catch (err) {
		res.status(500).send('Server Errror');
	}
});

router.post('/languages', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	let profileFields = { languages: [] };
	const values = Object.values(req.body);

	for (let i = 0; i < 5; ++i) {
		const language = values[i];
		const fluency = values[i + 5];

		if (language) {
			profileFields.languages.push({
				language,
				fluency,
			});
		}
	}

	try {
		let profile = await Profile.findOne({ user: req.user.id });
		if (profile) {
			profile = await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profileFields },
				{ new: true }
			);
			return res.json(profile);
		}

		profile = new Profile(profileFields);
		await profile.save();
		return res.json(profile);
	} catch (err) {
		res.status(500).send('Server Errror');
	}
});

router.post('/work', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	let profileFields = { work: [] };
	const values = Object.values(req.body);

	for (let i = 0; i < 3; ++i) {
		const company = values[i];
		const priority = values[i + 3];
		const position = values[i + 6];
		const website = values[i + 9];
		const startDate = values[i + 12];
		const endDate = values[i + 15];

		if (company) {
			profileFields.work.push({
				company,
				priority,
				position,
				website,
				startDate,
				endDate,
			});
		}
	}

	try {
		let profile = await Profile.findOne({ user: req.user.id });

		if (profile) {
			let profile = await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profileFields },
				{ new: true }
			);
			return res.json(profile);
		}

		profile = new Profile(profileFields);
		await profile.save();
		return res.json(profile);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

router.post('/education', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	let profileFields = { education: [], skills: [] };

	const skills = req.body.skills;

	if (skills.search(',') > 0) {
		const splitArray = skills.split(',').map((skill) => skill.trim());
		profileFields.skills = [...new Set(splitArray)];
	} else if (skills.length > 0) {
		profileFields.skills = skills;
	}

	const values = Object.values(req.body);

	for (let i = 1; i < 3; ++i) {
		const institution = values[i];
		const area = values[i + 3];
		const startDate = values[i + 6];
		const endDate = values[i + 9];
		const studyType = values[i + 12];

		if (institution) {
			profileFields.education.push({
				institution,
				area,
				startDate,
				endDate,
				studyType,
			});
		}
	}

	try {
		let profile = await Profile.findOne({ user: req.user.id });
		if (profile) {
			let profile = await Profile.findOneAndUpdate(
				{ user: req.user.id },
				{ $set: profileFields },
				{ new: true }
			);
			return res.json(profile);
		}

		profile = new Profile(profileFields);
		await profile.save();
		return res.json(profile);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

module.exports = router;
