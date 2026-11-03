/** Codes of the errors this package creates, set as `error.code`; `SKIP_*` codes mark a skipped quest in `getLastError()`. */
declare const EErrorCode: {
	/** `new SteamBadgeUnlocker(community)`: `community` has no `getSessionID`. */
	readonly MISSING_COMMUNITY: 'MISSING_COMMUNITY';
	/** `postSharedFileComment`: no file id, e.g. no `friendsScreenshotFileId` in PostCommentOnFriendsScreenshot. */
	readonly MISSING_FILE_ID: 'MISSING_FILE_ID';
	/** `postSharedFileComment`: no SteamID of the file owner. */
	readonly MISSING_FILE_OWNER_STEAM_ID: 'MISSING_FILE_OWNER_STEAM_ID';
	/** `uploadScreenshot`: the upload form page has no form action. */
	readonly MISSING_FORM_ACTION: 'MISSING_FORM_ACTION';
	/** `uploadScreenshot`: the upload form page has no token field. */
	readonly MISSING_TOKEN_FIELD: 'MISSING_TOKEN_FIELD';
	/** `uploadScreenshot`: the upload form page has no `wg` or `wg_hmac` field. */
	readonly MISSING_WG_FIELD: 'MISSING_WG_FIELD';
	/** `setYoutubeCookies`: no `accessToken`. */
	readonly MISSING_YOUTUBE_ACCESS_TOKEN: 'MISSING_YOUTUBE_ACCESS_TOKEN';
	/** `postYoutubeVideo`: Steam answers with the YouTube link page, so the access token is not accepted, e.g. it expired. */
	readonly INVALID_YOUTUBE_ACCESS_TOKEN: 'INVALID_YOUTUBE_ACCESS_TOKEN';
	/** `getWebApiToken`: the points shop page failed to load or has no `webapi_token`. */
	readonly NOT_FOUND_WEBAPI_TOKEN: 'NOT_FOUND_WEBAPI_TOKEN';
	/** `postSharedFileComment`: Steam reported success, but the new comment id was not found. */
	readonly ON_SUCCESS_ID_NOT_FOUND: 'ON_SUCCESS_ID_NOT_FOUND';
	/** `deleteSharedFileComment`: Steam refused or the comment is still there; Steam's text is the message when it sent one. */
	readonly REJECTED_COMMENT_DELETE: 'REJECTED_COMMENT_DELETE';
	/** `postSharedFileComment`: Steam refused, e.g. posting too often; Steam's text is the message. */
	readonly REJECTED_COMMENT_POST: 'REJECTED_COMMENT_POST';
	/** `deleteSharedFile`: Steam answered with an error page. */
	readonly REJECTED_SHARED_FILE_DELETE: 'REJECTED_SHARED_FILE_DELETE';
	/** `uploadScreenshot`: Steam did not confirm the upload. */
	readonly SCREENSHOT_UPLOAD_FAILED: 'SCREENSHOT_UPLOAD_FAILED';
	/** `deleteSharedFileComment`: the answer did not show whether the comment is gone. */
	readonly UNKNOWN_COMMENT_DELETE: 'UNKNOWN_COMMENT_DELETE';
	/** `postSharedFileComment`: the answer did not show whether the comment was posted. */
	readonly UNKNOWN_COMMENT_POST: 'UNKNOWN_COMMENT_POST';
	/** Quest skipped, no friend: AddFriendToFriendsList, PostCommentOnFriendsPage, PostCommentOnFriendsScreenshot, UseEmoticonInChat. */
	readonly SKIP_MISSING_FRIEND: 'SKIP_MISSING_FRIEND';
	/** Quest skipped, no `steamUser` option: PlayGame, UseEmoticonInChat. */
	readonly SKIP_MISSING_STEAM_USER: 'SKIP_MISSING_STEAM_USER';
	/** Quest skipped, no `youtubeCookies.accessToken`: PostVideo. */
	readonly SKIP_MISSING_YOUTUBE_ACCESS_TOKEN: 'SKIP_MISSING_YOUTUBE_ACCESS_TOKEN';
};

export = EErrorCode;
