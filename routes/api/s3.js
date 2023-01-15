const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');

const aws = require('aws-sdk');
const crypto = require('crypto');
const util = require('util');
const randomBytes = util.promisify(crypto.randomBytes);

const region = 'us-west-1';
const bucketName = 'whoo-images-new';

require('dotenv').config();
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECERET_ACCESS_KEY;

const s3 = new aws.S3({
	region,
	accessKeyId,
	secretAccessKey,
	signatureVersion: 'v4',
});

async function generateUploadURL() {
	const rawBytes = await randomBytes(16);
	const imageName = rawBytes.toString('hex');

	const params = {
		Bucket: bucketName,
		Key: imageName,
		Expires: 60,
	};

	const uploadURL = await s3.getSignedUrlPromise('putObject', params);
	return uploadURL;
}

// @route    Get api/s3
// @desc     Get url to upload images
// @access   Private
router.get('/', auth, async (req, res) => {
	try {
		const url = await generateUploadURL();
		res.send(url);
	} catch (err) {
		res.status(500).send('Server Error');
	}
});

module.exports = router;
