# best-game-01-v2

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/mohamad824/best-game-01-v2/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/mohamad824/best-game-01-v2/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

SALTWIND CARAVAN — a tower defence on a desert flat. Escort the heart-cart across 12 waves to the Far Gate while raiders chew at it. The wind shifts every wave and sail-towers fire ONLY downwind — spend a wind charge to turn it. Build barricades, sail towers, windmills and salt carts; keyboard 1–5, Space to send a wave, P pause, R restart, M mute. v2 rebuilds the game fresh with a fixed entrypoint (it never deletes the output directory itself) and a full 12-wave win verified live.

## Run it

```sh
cd game && python3 -m http.server 8080
```

Then open http://localhost:8080 in a desktop browser. No build step, no network at run time — every file the game loads lives under game/.

---

<sub>Entered on [make.fun](https://make.fun/?ref=196fg0bj&utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
