# Error codes

Look here when a log line ends in a code in capitals, e.g. `PostVideo SKIP_MISSING_YOUTUBE_ACCESS_TOKEN`, or
when your code catches an error with `error.code`. What the other log values mean (`OK`, `false`, `429`):
[FAQ: what does a log line say](../faq.md#what-does-a-log-line-say).

The codes are `SteamBadgeUnlocker.EErrorCode`. Details are properties of the error, not part of the code.
Errors of `steamcommunity` and `steam-user` pass through unchanged: an HTTP status such as `429` in
`error.code`, or a message such as `RateLimitExceeded` in `error.message`.

## Skipped tasks

A `SKIP_*` code means that the task sent no request because something it needs was not given. The run goes on.

| Code                                | Missing                                    | What to do                                                                            |
|-------------------------------------|--------------------------------------------|---------------------------------------------------------------------------------------|
| `SKIP_MISSING_FRIEND`               | no `masterInstance` and no `friendSteamId` | give the run a master, see [options](options.md#options-that-turn-tasks-on)           |
| `SKIP_MISSING_STEAM_USER`           | no `steamUser`                             | pass the bot's logged-in `steam-user` client                                          |
| `SKIP_MISSING_YOUTUBE_ACCESS_TOKEN` | no `youtubeCookies.accessToken`            | [get the YouTube cookie](../how-to/get-the-youtube-cookie.md), or leave PostVideo off |

## Errors

| Code                                                             | Meaning                                                                                                                                                                                                  | What to do                                                                                                                            |
|------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|
| `ACCESS_DENIED`                                                  | Steam's CDN (Akamai) answered `403 Access Denied`: web requests from this IP are blocked, the store included. `start()` runs no further task; the error carries `quest`, `method`, `url` and `reference` | stop all Steam web requests from that IP and wait, see [How to react to 429 or a blocked IP](../how-to/handle-429-or-a-blocked-ip.md) |
| `MISSING_COMMUNITY`                                              | `new SteamBadgeUnlocker()` got `undefined`, `null` or an object without `getSessionID`                                                                                                                   | pass a logged-in `steamcommunity` instance                                                                                            |
| `MISSING_FILE_ID`                                                | no screenshot id for the screenshot comment, e.g. the master has no screenshot                                                                                                                           | upload a screenshot on the master and make it public, or set `friendsScreenshotFileId`                                                |
| `MISSING_FILE_OWNER_STEAM_ID`                                    | no owner SteamID for the screenshot comment                                                                                                                                                              | give the run a friend                                                                                                                 |
| `MISSING_FORM_ACTION`, `MISSING_TOKEN_FIELD`, `MISSING_WG_FIELD` | the screenshot upload form did not load or has changed                                                                                                                                                   | run again later; report it if it stays                                                                                                |
| `MISSING_YOUTUBE_ACCESS_TOKEN`                                   | `setYoutubeCookies` got no `accessToken`                                                                                                                                                                 | pass the cookie value                                                                                                                 |
| `INVALID_YOUTUBE_ACCESS_TOKEN`                                   | Steam did not accept the YouTube token; with an expired token and no `youtubeId`, PostVideo logs `false` instead                                                                                         | link YouTube again and copy a fresh value                                                                                             |
| `NOT_FOUND_WEBAPI_TOKEN`                                         | the points shop page did not load or had no `webapi_token`                                                                                                                                               | check the session, or pass `apiToken`                                                                                                 |
| `ON_SUCCESS_ID_NOT_FOUND`                                        | the comment was posted, but its id was not found, so it stays                                                                                                                                            | delete it by hand if it matters                                                                                                       |
| `REJECTED_COMMENT_POST`, `REJECTED_COMMENT_DELETE`               | Steam refused the comment; Steam's text, when it sent one, is the error's `message`                                                                                                                      | wait, e.g. after posting too often                                                                                                    |
| `REJECTED_SHARED_FILE_DELETE`                                    | Steam refused to delete the screenshot or video                                                                                                                                                          | delete it by hand                                                                                                                     |
| `SCREENSHOT_UPLOAD_FAILED`                                       | Steam did not confirm the upload                                                                                                                                                                         | run again later                                                                                                                       |
| `UNKNOWN_COMMENT_POST`, `UNKNOWN_COMMENT_DELETE`                 | Steam's answer showed neither success nor error                                                                                                                                                          | run again later; report it if it stays                                                                                                |

The delete codes (`REJECTED_COMMENT_DELETE`, `UNKNOWN_COMMENT_DELETE`, `REJECTED_SHARED_FILE_DELETE`) only
reach code that calls the delete methods itself: inside the tasks a failed cleanup is not logged.

## Results in code

| Call                                                   | Result                                                                                                                      |
|--------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------|
| an automated quest method, e.g. `leader.JoinGroup()`   | `true` when its requests succeeded, otherwise `false`                                                                       |
| `leader.Trade()`                                       | `false`: not implemented                                                                                                    |
| BuyOrSellOnMarket and the three security quest methods | `null`; `start()` never runs them                                                                                           |
| `leader.getLastError()`                                | the error of the last quest call, or `null`; after `start()` rejected with `ACCESS_DENIED`, that error; `error.code` holds the codes above and HTTP statuses, `error.message` the rest |
| `leader.start()`                                       | resolves when the run is done; rejects when the request for the open tasks fails, or with `ACCESS_DENIED`                   |
| `leader.finish()`                                      | `true`; `false` when removing the friend failed                                                                             |
