import EErrorCode = require('../resources/EErrorCode');
import SteamBadgeUnlocker = require('../index');

export type ErrorCode = keyof typeof EErrorCode;
export type CommentType = 'ClanAnnouncement' | 'ForumTopic' | 'PublishedFile_Public' | 'Recommendation' | 'UserReceivedNewGame' | 'UserStatusPublished';
export type CommentActionType = 'upvote' | 'downvote' | 'delete' | 'post' | 'render' | 'hideandreport';

export interface CommentActionParams {
	type: CommentType;
	action?: CommentActionType;
	owner: string;
	feature: string;
	feature2?: string;
}

/** Resolves after `seconds`. */
export function delay(seconds: number): Promise<void>;
/** Error with `code`; the message defaults to the code. */
export function createError<T extends ErrorCode>(code: T, message?: string): Error & {code: T};
/**
 * `ACCESS_DENIED` when the response is the `403 Access Denied` page of Steam's CDN (Akamai), otherwise `null`.
 * `url` is the request URL without its query; `reference` is the Akamai reference number of the page.
 */
export function getAccessDeniedError(
	response: {statusCode?: number, headers?: {[name: string]: unknown}} | null | undefined,
	body: unknown,
	request?: Pick<SteamBadgeUnlocker.RequestParams, 'url' | 'uri' | 'method'>,
): (Error & {code: 'ACCESS_DENIED', statusCode: 403, reference: string | null, url: string | null, method: string}) | null;
/**
 * Runs `run`; until it settles, `editOptions` edits every request of `community` before it is sent.
 * Uses the steamcommunity `onPreHttpRequest` hook, chains the hook set before and restores it afterwards.
 */
export function withRequestOptions<T>(community: SteamBadgeUnlocker.SteamCommunityLike, editOptions: (options: SteamBadgeUnlocker.RequestParams) => void, run: () => Promise<T>): Promise<T>;
/**
 * Temporary until steamcommunity sends them itself: runs `run` while every request of `community` without
 * an `Accept-Language` header (any letter case) gets `en-US,en;q=0.9`; without it Steam can answer `/edit/info` with
 * HTTP 429.
 */
export function withMissingRequiredHeaders<T>(community: SteamBadgeUnlocker.SteamCommunityLike, run: () => Promise<T>): Promise<T>;
/** `https://steamcommunity.com/comment/<type>/<action>/<owner>/<feature>/`. */
export function getActionUrl(params: CommentActionParams): string;
/** `true` for a 17-digit SteamID64. Test helper, not covered by semver. */
export function isSteamId(value: string): boolean;
/** Parses lines `accountName;password;sharedSecret;params…` and skips invalid lines. Test helper, not covered by semver. */
export function parseConfigString(config: string, delimiter?: string): Array<{accountName: string, password: string, secret: string, params: string[]}>;
