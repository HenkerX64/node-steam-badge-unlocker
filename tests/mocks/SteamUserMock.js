module.exports = SteamUserMock;

function SteamUserMock() {
	this.requestFreeLicense = async () => null;
	this.gamesPlayed = () => null;
	this.chat = {
		sendFriendMessage: async () => true,
	};
}
