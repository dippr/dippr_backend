class UserDatabase {
	constructor() {
		this.users = {};
	}

	getUser(userID) {
		return this.users[userID] || null;
	}

	changeUsername(userID, newUsername) {
		if(!this.users[userID]) return false;
		this.users[userID].username = newUsername;

		return true;
	}

	findOrCreateNewUser({
		userID,
		username
	}) {
		if(this.users[userID]) return this.users[userID];

		this.users[userID] = {
			id: userID,
			username
		};

		return this.users[userID];
	}
}

module.exports = {
	UserDatabase
};