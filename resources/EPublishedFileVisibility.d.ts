/** Visibility of a published file such as a screenshot, by name and by id; the same values as steam-user's EPublishedFileVisibility. */
declare const EPublishedFileVisibility: {
	readonly 0: 'Public';
	readonly 1: 'FriendsOnly';
	readonly 2: 'Private';
	readonly 3: 'Unlisted';
	readonly Public: 0;
	readonly FriendsOnly: 1;
	readonly Private: 2;
	readonly Unlisted: 3;
};

export = EPublishedFileVisibility;
