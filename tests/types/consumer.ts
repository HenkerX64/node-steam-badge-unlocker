import SteamBadgeUnlocker = require('steam-badge-unlocker');
import {createError, parseConfigString, withMissingRequiredHeaders, withRequestOptions} from 'steam-badge-unlocker/components/helpers';
import ECommunityBadgeQuests = require('steam-badge-unlocker/resources/ECommunityBadgeQuests');
import OCommunityLeaderDefault = require('steam-badge-unlocker/resources/OCommunityLeaderDefault');

declare const community: SteamBadgeUnlocker.SteamCommunityLike;

const unlocker = new SteamBadgeUnlocker(community, {apiKey: 'key'});
const defaultExport: SteamBadgeUnlocker = new SteamBadgeUnlocker.default(community);
const logged: Array<[string, unknown]> = [];
const leader = unlocker.createCommunityLeader({playSeconds: 0, log: (key, value) => logged.push([key, value])});

async function runQuests(): Promise<string | null> {
	await leader.start();
	const posted: boolean = await leader.PostVideo();
	const manual: null = await leader.SetupSteamGuard();
	const finished: boolean = await leader.finish();
	const error = leader.getLastError();
	return error ? error.message : (posted && manual === null && finished ? 'OK' : null);
}

const skipCode: SteamBadgeUnlocker.ErrorCode = 'SKIP_MISSING_FRIEND';
const fileIdError = createError(SteamBadgeUnlocker.EErrorCode.MISSING_FILE_ID);
const fileIdCode: 'MISSING_FILE_ID' = fileIdError.code;
const questName: string | undefined = ECommunityBadgeQuests[101];
const joinGroupId: 101 = SteamBadgeUnlocker.ECommunityBadgeQuests.JoinGroup;
const playSeconds: number = OCommunityLeaderDefault.playSeconds;
const withHeaders: Promise<number> = withMissingRequiredHeaders(community, async () => 1);
const withOptions: Promise<string> = withRequestOptions(community, (options) => {
	options.headers = Object.assign({}, options.headers);
}, async () => 'done');
const accountParams: number[] = parseConfigString('user;password1;').map(account => account.params.length);
// @ts-expect-error a code that is not in EErrorCode
const unknownCode: SteamBadgeUnlocker.ErrorCode = 'UNKNOWN_CODE';

export {runQuests, defaultExport, skipCode, fileIdCode, questName, joinGroupId, playSeconds, withHeaders, withOptions, accountParams, unknownCode};
