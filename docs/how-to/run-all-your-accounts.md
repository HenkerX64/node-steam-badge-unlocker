# How to run the quests for all your accounts

This guide runs `examples/run-community-leader.js` for all your accounts at once. It assumes the script and
`examples/utils/` are in your project, as after [Getting started](../getting-started.md).

## Write the accounts file

Put every account into one CSV file, the master in the first row after the header:

```csv
username,password,shared_secret
master_account,master_password,base64SharedSecretOfTheMaster=
bot_account_1,bot_password_1,base64SharedSecretOfBot1=
bot_account_2,bot_password_2,base64SharedSecretOfBot2=
```

- The first line names the columns; more columns are ignored, so an export with
  `identity_secret`, `steam64_id` and similar columns works as it is.
- Values must not contain commas.
- The file can live anywhere; its path is the first argument of the script.
- Keep the file and the `<file>.tokens.json` next to it out of version control.

Where `shared_secret` comes from: [data sources](../reference/data-sources.md). What the master needs:
[requirements](../reference/requirements.md#the-master).

## Run it

```bash
node run-community-leader.js accounts.csv
```

- To run only the first rows, add their number: `node run-community-leader.js accounts.csv 4` runs the
  master and 3 bots.
- To include PostVideo, set `YT_ACCESS_TOKEN`, see [How to get the YouTube cookie](get-the-youtube-cookie.md).

The script logs in the master, then each bot 10 seconds apart, and runs the bots one after another. Plan
about 6 minutes per bot while PlayGame is open: eight accounts take at least 40 minutes. Keep the account count
around 10 per machine ([Steam limits](../how-it-works.md#steam-limits)).

## Handle login problems

- **The master cannot log in:** the script stops. Fix the master's row and start again.
- **A bot logs `login … Steam Guard code needed (email)`:** the bot is skipped. Give the account a mobile
  authenticator and add its `shared_secret`, or log it in once with `steam-user` yourself, take the token from
  its `refreshToken` event and store it in `accounts.csv.tokens.json` as `{"<username>": "<refreshToken>"}`.
- **A bot logs `login …` with a Steam error after earlier runs worked:** its stored token failed. Delete the
  bot's entry from `accounts.csv.tokens.json`; the next run logs in with the password.
- **Logins end in `RateLimitExceeded`:** too many logins in a short time. Wait before the next run.

## Run again

Run the same command again for the accounts that still have open quests: `start()` only runs the quests that
are still open. To rerun only some bots, write a second file with the master and those bots.

## Run the master's quests

The master runs no quests in its own run. Write a file with another account in the first row and the former
master as a bot, and run it. The new master needs the same
[master requirements](../reference/requirements.md#the-master).

## Next

- Quests failed with `429` or the script stopped with `stopped Steam blocks web requests`:
  [How to react to 429 or a blocked IP](handle-429-or-a-blocked-ip.md).
- See which quests are left: [How to check quest progress](check-quest-progress.md).
- What each log value means: [FAQ](../faq.md#what-does-a-log-line-say).
