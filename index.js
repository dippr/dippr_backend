require('dotenv').config();
require('./root_path');

const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const { body, param, validationResult } = require('express-validator');
const rateLimit = require("express-rate-limit");

const { getStreamerID, privateRouteMiddleware, contentTypeMiddleware } = include('$modules/Utils');

const { UserDatabase } = include('$modules/UserDatabase');
const WebStream = include('$modules/WebStream');

const app = express();
const httpServer = http.Server(app);

const PORT = process.env.PORT || 3001;

const PublicAPIRouter = express.Router();
const PrivateAPIRouter = express.Router();

const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100,
	message: "You are being ratelimited. Try again in 15 minutes."
});

let streams = {};
let users = new UserDatabase();

app.use(cors({
	origin: process.env.FRONTEND_URL
}));

app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// app.use((req, res, next) => {
// 	console.log("test", req.path)
// 	next();
// });

app.use('/', PublicAPIRouter);
app.use('/', PrivateAPIRouter);
app.use('/debug', express.static(path.join(__dirname, 'debug')));

PublicAPIRouter.use(apiLimiter);

PrivateAPIRouter.use(cors({
	origin: process.env.STREAM_URL
}));

PrivateAPIRouter.use(privateRouteMiddleware);

PublicAPIRouter.get('/streams', (req, res) => {
	res.json({
		streams: Object.values(streams).reduce(
			(acc, val) => val.active ? acc.concat(val.sendable()) : acc
		, [])
	});
});

PublicAPIRouter.get('/stream/:streamID', (req, res) => {
	let stream = streams[req.params.streamID] || null;
	if(stream) stream.sendable();

	res.json({
		stream
	});
});

PublicAPIRouter.get('/user/me', (req, res) => {
	res.json({
		user: users.getUser(getStreamerID(req.ip))
	});
});

PublicAPIRouter.get('/user/:userID', param('userID').isLength({ min: 1, max: 30 }).trim(),
	(req, res) => {
		const errors = validationResult(req);
		if(!errors.isEmpty()) return res.status(400).json({ err: errors.array() });

		res.json({
			user: users.getUser(req.params.userID)
		});
	}
);

PublicAPIRouter.post('/create_stream',
	rateLimit({
		windowMs: 60 * 60 * 1000, // 1 hour
		max: 10,
		message: "You are being ratelimited. Try again in an hour."
	}),
	contentTypeMiddleware,
	body('title').isLength({ min: 2, max: 30 }).trim(),
	(req, res) => {
		const errors = validationResult(req);
		if(!errors.isEmpty()) return res.status(400).json({ err: errors.array() });

		if(Object.keys(streams).length >= 5) return res.status(400).json({ err: "Global stream limit maxed." });

		const streamerID = getStreamerID(req.ip);
		if(!users.getUser(streamerID)) return res.status(400).json({ err: "User not found. Set your username first before streaming." });

		const webStream = new WebStream({
			title: req.body.title,
			streamerID
		});

		streams[webStream.id] = webStream;

		res.json({
			stream: webStream.sendable(),
			streamKey: webStream.getStreamKey()
		});
	}
);

PublicAPIRouter.post('/update_username', contentTypeMiddleware,
	body('username').isLength({ min: 3, max: 15 }).trim(),
	(req, res) => {
		const errors = validationResult(req);
		if(!errors.isEmpty()) return res.status(400).json({ err: errors.array() });

		const streamerID = getStreamerID(req.ip);
		let user = users.getUser(streamerID);

		if(!users.changeUsername(streamerID, req.body.username)) {
			user = users.findOrCreateNewUser({
				userID: streamerID,
				username: req.body.username
			});
		}

		res.json({
			user
		});
	}
);

PrivateAPIRouter.post('/verify', contentTypeMiddleware,
	body('id').trim().isLength({ min: 7, max: 7 }),
	body('streamKey').trim().isLength({ min: 25, max: 25 }),
	(req, res) => {
		const errors = validationResult(req);
		if(!errors.isEmpty()) return res.status(400).json({ err: errors.array() });

		const webStream = streams[req.body.id];
		if(!webStream) return res.status(400).json({err: "Stream Not Found"});
		if(!webStream.matchStreamKey(req.body.streamKey)) return res.status(400).json({err: "Invalid Stream Key"});

		res.json({
			verified: true
		});
	}
);

PrivateAPIRouter.post('/activate_stream', contentTypeMiddleware,
	body('streamID').trim().isLength({ min: 7, max: 7 }),
	(req, res) => {
		const errors = validationResult(req);
		if(!errors.isEmpty()) return res.status(400).json({ err: errors.array() });

		const webStream = streams[req.body.streamID];
		if(!webStream) return res.status(400).json({err: "Stream Not Found"});

		webStream.setActive();

		res.json({
			activated: true
		});
	}
);

setInterval(() => {
	let webStreamKeys = Object.keys(streams);

	for (let i = webStreamKeys.length - 1; i >= 0; i--) {
		const webStream = streams[webStreamKeys[i]];
		const msSinceLastActive = Date.now() - webStream.lastActiveDate;

		if(msSinceLastActive > 12000) {
			delete streams[webStreamKeys[i]];
		}
	}
}, 1000);

httpServer.listen(PORT, () => {
	console.log('BACKEND SERVER - listening on *:' + PORT);
});