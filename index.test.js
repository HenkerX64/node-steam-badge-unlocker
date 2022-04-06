
describe('index.js', () => {
	require('./tests/index.test');
});

describe('apps.js', () => {
	require('./tests/components/apps.test');
});

describe('badges.js', () => {
	require('./tests/components/badges.test');
});

describe('broadcast.js', () => {
	require('./tests/components/broadcast.test');
});

describe('discussions.js', () => {
	require('./tests/components/discussions.test');
});

describe('helpers.js', () => {
	require('./tests/components/helpers.test');
});

describe('guides.js', () => {
	require('./tests/components/guides.test');
});

describe('profile.js', () => {
	require('./tests/components/profile.test');
});

describe('sharedfiles.js', () => {
	require('./tests/components/sharedfiles.test');
});

describe('videos.js', () => {
	require('./tests/components/videos.test');
});

describe('wishlist.js', () => {
	require('./tests/components/wishlist.test');
});

describe('workshop.js', () => {
	require('./tests/components/workshop.test');
});

describe('CCommunityLeader class', () => {
	require('./tests/classes/CCommunityLeader.test');
});

// Execute live tests only if you configured environment variable
// Example: export TEST_ACCOUNTS="username;password;sharedKey;"
if (typeof process.env.TEST_ACCOUNTS === 'undefined') {
	return;
}
describe('Real request tests', () => {
	require('./tests/real.test');
});
