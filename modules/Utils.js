const Utils = {};

Utils.getStreamerID = (ip) => {
	if(ip.length < 5) ip = "127.0.0.1";

	return ("X".repeat(7) + Number(ip.split(".").join("1")).toString(36).toUpperCase()).slice(-7);
};

Utils.makeID = (length=7) => {
	let text = "";
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

	for (let i = 0; i < length; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));

	return text;
};

Utils.privateRouteMiddleware = (req, res, next) => {
	let authKey = req.get('Authorization');
	if(!authKey) return res.json({err: "Authorization Not Found"});
	if(!authKey.includes(process.env.BACKEND_KEY)) return res.json({err: "Invalid Authorization Key"});

	next();
};

Utils.contentTypeMiddleware = (req, res, next) => {
	if(!req.get('Content-Type')) return res.send("error");

	next();
};

module.exports = Utils;