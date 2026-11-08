# How to react to 429 or a blocked IP and run again

This guide gets a run going again after Steam limited or blocked your IP. Find your case by the log.

## Quests log `429` or `RateLimitExceeded`

Steam answered a burst of requests with a rate limit.

1. Stop sending requests from that IP for minutes, not seconds. Do not retry right away.
2. Run the same accounts again. `start()` only runs the quests that are still open, so the quests that
   succeeded are not repeated.

If logins fail with `RateLimitExceeded`, there were too many logins in a short time: wait before the next
run. `examples/run-community-leader.js` already waits 10 seconds between logins; in your own code, do the same.

## The run stops with `ACCESS_DENIED`

`examples/run-community-leader.js` logs `start …` and
`stopped Steam blocks web requests from this IP: <method> <url>, reference <reference>`, and runs no further
bot; when a quest was running, a `<quest> ACCESS_DENIED` line comes first. Steam's CDN (Akamai) blocks web
requests from this IP, the store included.

1. Stop all Steam web requests from that IP, also from other tools. Requests during the block can extend it.
2. Wait before the next run.
3. Run again with the same accounts file; the bot that stopped and the bots after it still have their open
   quests. Or run from another IP or through a proxy.

In your own code, `start()` rejects with an error whose `code` is `ACCESS_DENIED` and that carries `quest`,
`method`, `url` and `reference`. Stop the remaining bots of the run on it, see
[How to add it to an existing project](add-to-an-existing-project.md#handle-a-blocked-ip).

## Check what is left

Before the next run, see which quests are still open: [How to check quest progress](check-quest-progress.md).

Why Steam limits a machine with many accounts and what ArchiSteamFarm recommends:
[Steam limits](../how-it-works.md#steam-limits).
