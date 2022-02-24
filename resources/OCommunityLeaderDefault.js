/** @class OCommunityLeaderDefault */
module.exports = {
    /** @type {string} */
    friendSteamId: null,
    forceRemoveFriend: false,
    forceAddFriend: false,
    /** @type {number} Last Year */
    wishlistAppId: 1195460,
    /** @type {number|null} (optional) */
    craftGameBadgeAppId: null,
    /** @type {number} */
    featureBadgeId: 2,
    /** @type {string} Steam Universe */
    joinGroupId: '103582791434672565',
    leaveGroupAutomatically: true,
    /** @type {string} */
    friendsPageComment: 'test',
    /** @type {string} */
    friendsScreenshotComment: 'test',
    /** @type {string} */
    friendsScreenshotFileId: null,
    /** @type {string} */
    statusText: 'test',
    /** @type {number} */
    statusAppId: 0,

    /** @type {number} */
    screenshotAppId: 767,
    /** @type {string} */
    screenshotTitle: 'test',
    /** @type {string} */
    screenshotDescription: '',
    /** @type {string} */
    screenshotPath: __dirname + '/empty.png',

    /** @type {string} */
    youtubeId: null,
    /** @type {YoutubeCookies} */
    youtubeCookies: {
        accessToken: '',
        authAccount: '',
        refreshToken: 'null',
    },

    /** @type {string} */
    workshopFileId: '308490450',
    /** @type {number} */
    workshopAppId: 730,

    /** @type {number} */
    reviewAppId: 730,
    /** @type {string} */
    reviewText: 'Temporary recommendation',

    /** @type {string} */
    discussionsKeyword: 'GlobalDiscussionSearchForm',
    /** @type {string} */
    realName: 'John',
    resetRealName: true,

    /**
     * @type {number}
     * @link https://steamcommunity.com/games/582660/Avatar/List
     */
    avatarAppId: 582660,
    /** @type {number} */
    avatarIndex: 4,
    /** @type {string|null} (optional) */
    broadcastWatchId: null,

    /** @type {string|null} (optional) */
    guideFileId: null,
    steamOverlayUserAgent: 'Mozilla/5.0 (Windows; U; Windows NT 10.0; en-US; Valve Steam GameOverlay/1639697812; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36',

    /** @type {number} */
    playAppId: 730,
    /** @type {number} */
    playSeconds: 330,

    /** @type {string} */
    emotionMessageText: ':steamthumbsup:',

    /** @type {SteamUser} */
    steamUser: null,

    /** @type {function|null} (optional) */
    log: null,
    /**
     * Master instance should invite limited accounts and interact with slave instances.
     * @type {SteamCommunity|null} (optional)
     */
    masterInstance: null,
};
