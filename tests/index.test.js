
describe('index.js', () => {
	require('./mocked.test');
});

describe('apps.js', () => {
	require('./components/apps.test');
});

describe('badges.js', () => {
	require('./components/badges.test');
});

describe('broadcast.js', () => {
	require('./components/broadcast.test');
});

describe('discussions.js', () => {
	require('./components/discussions.test');
});

describe('helpers.js', () => {
	require('./components/helpers.test');
});

describe('guides.js', () => {
	require('./components/guides.test');
});

describe('profile.js', () => {
	require('./components/profile.test');
});

describe('sharedfiles.js', () => {
	require('./components/sharedfiles.test');
});

describe('videos.js', () => {
	require('./components/videos.test');
});

describe('wishlist.js', () => {
	require('./components/wishlist.test');
});

describe('workshop.js', () => {
	require('./components/workshop.test');
});

describe('CCommunityLeader class', () => {
	require('./classes/CCommunityLeader.test');
});

// Execute live tests only if you configured environment variable
// Example: export TEST_ACCOUNTS="username;password;sharedKey;"
if (typeof process.env.TEST_ACCOUNTS === 'undefined') {
	return;
}
describe('Real request tests', () => {
	require('./real.test');
});
