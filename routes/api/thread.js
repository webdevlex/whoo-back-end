const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Thread = require('../../models/Thread');

const ALLOW_TEST_PROFILE_CHANGES = true;
function testProfile(id) {
	if (ALLOW_TEST_PROFILE_CHANGES) return false;
	return id === '61f091ce9cbbc5dde3a66756';
}

// @route    Post api/thread
// @desc     post a thread
// @access   Private
router.post('/', auth, async (req, res) => {
	if (testProfile(req.user.id)) {
		return res.status(400).json({ testProfile: true });
	}

	const NEW_THREAD_FLAG = 0;
	const date = new Date();
	const currentTimeInMilliseconds = date.getTime();

	try {
		if (req.body._id !== NEW_THREAD_FLAG) {
			let thread = await Thread.findOne({ _id: req.body._id });

			if (thread) {
				let newMessages = {
					messages: [
						...thread.messages,
						{
							from: req.user.id,
							fullName: req.body.fullName,
							message: req.body.message,
							username: req.body.username,
							timeSent: currentTimeInMilliseconds,
						},
					],
					lastUpdated: currentTimeInMilliseconds,
				};
				thread = await Thread.findOneAndUpdate(
					{ _id: req.body._id },
					{ $set: newMessages },
					{ new: true }
				);
				return res.json(thread);
			}
		}
		let newThread = {
			members: req.body.members,
			memberProfiles: req.body.memberProfiles,
			messages: [
				{
					from: req.user.id,
					fullName: req.body.fullName,
					message: req.body.message,
					username: req.body.username,
					timeSent: currentTimeInMilliseconds,
				},
			],
			lastUpdated: currentTimeInMilliseconds,
		};

		let thread = new Thread(newThread);
		await thread.save();
		return res.json(thread);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

router.post('/default', auth, async (req, res) => {
	const date = new Date();
	const currentTimeInMilliseconds = date.getTime();

	try {
		let newThread = {
			members: req.body.members,
			memberProfiles: req.body.memberProfiles,
			messages: [
				{
					fullName: 'Alexis Martin',
					username: 'webdevlex',
					from: '61e352500d22e1189a6c92b0',
					message: req.body.message,
					timeSent: currentTimeInMilliseconds,
				},
			],
			lastUpdated: currentTimeInMilliseconds,
		};
		let thread = new Thread(newThread);
		await thread.save();
		return res.json(thread);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

router.get('/', auth, async (req, res) => {
	try {
		let threads = await Thread.find({ members: req.user.id });
		res.json(threads);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

module.exports = router;
