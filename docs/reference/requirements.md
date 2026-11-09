# Requirements

Check here before a run, or when a task is skipped or fails although the run has everything it asks for. What
each task needs on top: [tasks](../tasks.md). Why there is a
master: [How it works](../how-it-works.md#the-master-and-the-bots).

## Software

| Package                                                                              | Version                                                                   | Needed for                                                                |
|--------------------------------------------------------------------------------------|---------------------------------------------------------------------------|---------------------------------------------------------------------------|
| Node.js                                                                              | `>=10` for the package; `>=14` for `steam-user` 5 and the example scripts | everything                                                                |
| [`steamcommunity`](https://www.npmjs.com/package/steamcommunity)                     | `>=3.43.1`, tested with 3.50.3                                            | every quest; one logged-in instance per account                           |
| [`steam-user`](https://www.npmjs.com/package/steam-user)                             | `>=5.0.0`, optional                                                       | PlayGame and UseEmoticonInChat; the example scripts log in with it        |
| `steam-totp`                                                                         | example scripts only                                                      | the login code from `shared_secret` in `examples/utils/login-accounts.js` |

The package does not pin `steamcommunity` or `steam-user`; the project installs its own versions. It
requires the internal path `steamcommunity/components/helpers`, so a `steamcommunity` release that moves it
breaks the package.

## Account types

| Term            | Meaning                                                                                            |
|-----------------|----------------------------------------------------------------------------------------------------|
| full account    | an account that is not limited                                                                     |
| limited account | an account that has spent less than 5 USD on Steam; it can accept friend invites but not send them |
| master          | the account that is the friend of every bot in a run; it runs no quests in that run                |
| bot             | an account that runs the quests in a run                                                           |

## Every account

| Requirement                                                                                                                                          | Without it                                                                                                          |
|------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------|
| a Steam Community profile that has been set up once: "Set up Steam Profile" on steamcommunity.com, or `community.setupProfile()` of `steamcommunity` | the badge page shows no quests; `start()` logs `error not able to get badge progress` and `{openQuests: 0}`         |
| Steam Guard enabled                                                                                                                                  | `start()` does not run PostCommentOnFriendsPage: Steam allows profile comments only with Steam Guard                |
| its own logged-in `steamcommunity` instance; the master's instance may serve all bots                                                                | `new SteamBadgeUnlocker()` throws `MISSING_COMMUNITY` when it gets no instance                                      |
| with `examples/utils/login-accounts.js`: a mobile authenticator with its `shared_secret`, or a stored refresh token                                  | the account is skipped at login with `Steam Guard code needed (email)` or `Steam Guard code needed (authenticator)` |

## The master

| Requirement                                                                                     | Without it                                                                                                                                                                                              |
|-------------------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| a full account                                                                                  | the master cannot send the friend invite; a failed master invite is not logged                                                                                                                          |
| a public newest screenshot                                                                      | without any screenshot, `start()` logs `{friendsScreenshotFileId: null}` and PostCommentOnFriendsScreenshot fails with `MISSING_FILE_ID`; with a private newest screenshot the screenshot comment fails |
| friends may comment on its profile and screenshots (Edit Profile → Privacy Settings → Comments) | the profile and screenshot comments fail                                                                                                                                                                |

The screenshot id is read once per process for all bots, also when it is `null`.

## The bots

| Account state                                | Quests that `start()` does not run                                     |
|----------------------------------------------|------------------------------------------------------------------------|
| limited                                      | PostCommentOnFriendsScreenshot, RecommendGame, RateWorkshopItem        |
| VAC-banned                                   | RateWorkshopItem                                                       |
| trade-banned                                 | Trade                                                                  |
| SetupSteamGuard quest open (Steam Guard off) | PostCommentOnFriendsPage                                               |

A bot may be limited when the master is a full account. RecommendGame may need the bot to own `reviewAppId`
(default 730). Quests that need `steam-user`, a YouTube cookie, trading cards or a profile background:
[tasks](../tasks.md).
