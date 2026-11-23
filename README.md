# Shmup

An original vertical arcade shooter built with Phaser, TypeScript, and Vite. The first playable encounter tests how it feels to sweep across the screen, dodge, and return to a firing lane on an iPad with an 8BitDo Lite 2.

Pushes to `controller-flight` automatically rebuild the [public iPad preview](https://funkatron.github.io/Shmup/). Refresh after the Pages workflow succeeds and check the commit shown above the playfield.

## Play the crossing encounter

| Control or cue | What it does |
|---|---|
| D-pad or left stick | Steer in eight directions at 210 logical pixels per second. Release to stop. |
| Start (+) | Press once to pause and see flight stats. Press again to resume. |
| Bottom face button | Hold for continuous forward fire. Each yellow bolt stays in its firing lane. |
| Red wireframe ship | Crosses every five seconds. A direct hit produces a gold burst. |
| Orange scouts | Five arc in from the left. Four faster scouts skim in from the right below them during the chip chase. Each takes one hit. Both flights clear before the next carrier pass. |
| Green cargo carrier | Enters from the right at the start and switches banks every ten seconds. Shoot it once, then fly through the pulsing green chip to equip a cyan wing pod on your right. Hold fire for two parallel bolts per volley. Chip two equips the left pod and immediately angles both outer bolts outward by 12°. Chip three adds a pair of homing missiles. Every further chip adds another missile from each pod, filling in the fan inside its 45° outer trails. The spread stays active. |
| Magenta diamond | A surviving target fires one second into its pass. The shot travels straight toward your position at launch. |

Every other carrier pass mirrors the raider and both scout flights too. Sound starts enabled. If Safari waits for interaction, tap the playfield once. The sound button remembers your mute choice on this browser. Scouts crack quickly and the carrier breaks up with a longer, lower thud. A red-orange and blue fringe briefly splits around each wreck. Tap **Sound on** to mute.

To try the dodge, let the target fire first. Move across the diamond’s path, then hold fire and sweep back into position. A hit on your ship flashes and makes a short, crunchy low strike. Play continues. A rising four-note chime marks chip collection, each missile volley launches with one falling whistle, and the Warden winds up audibly as its aim traces appear.

The pause panel counts individual bolts and missiles that hit out of all projectiles fired. Destroyed includes Wardens. Chips and incoming projectile hits count each contact. A new page load starts a fresh flight.

### Compare the parallax

Violet folds scroll at 18 logical pixels per second, the blue canyon walls at 70, and the projecting ledges at 148. Try following the green chip while the scouts cross. Can you glance up at a target and find your ship and the incoming diamond again? Both previews run the same encounter. [With parallax](https://funkatron.github.io/Shmup/) · [Without the extra terrain layers](https://funkatron.github.io/Shmup/?parallax=off)

### Compare the bridge

A dim blue truss travels with the canyon floor about once every nine seconds. Hold fire and sweep sideways as it passes beneath the ship. Watch the gaps between your yellow bolts and the magenta incoming diamond. Use the same maneuver in both previews. [With the bridge](http://127.0.0.1:4273/) · [Without the bridge](http://127.0.0.1:4273/?bridge=off)

## Run on Raiden and play on iPad

1. **Build.** Use Node 24, npm, and a checkout of the branch you want to play. From the checkout run `npm ci && npm run build`.
2. **Start the preview.** Leave this running in a terminal or tmux window on Raiden.

   ```sh
   npm exec -- vite preview --host 127.0.0.1 --port 4173 --strictPort
   ```

3. **Connect the iPad.** In Termius, start a **Local** forwarding rule with bind address `127.0.0.1`, local port **4273**, your saved Raiden SSH host, and destination `127.0.0.1:4173`. Open the preview in Safari, connect the Lite 2 over Bluetooth, and press a face button. [Open the iPad preview](http://127.0.0.1:4273/)
4. **Try a change.** In a second shell on the same branch, run the line below, then refresh Safari. Compare the printed commit with the one above the playfield. The UTC timestamp identifies the individual build, including rebuilds of the same commit.

   ```sh
   git pull --ff-only && npm run build && git rev-parse --short=7 HEAD
   ```

If Safari cannot connect, check `curl http://127.0.0.1:4173/` on Raiden. If that returns the flight-test HTML, check that the Termius rule is running and Safari is using port **4273**. Restart the preview process after changing its server configuration. For local development with automatic reloads, run `npm run dev` and open the URL Vite prints.

## Project notes

[Agent log and design references](agents/log.md) · [Contributor instructions](AGENTS.md)

## Movement reference

The [Musha Aleste flight study](docs/musha-aleste.md) breaks down Edward’s Stage 1 reference clip and explains how scroll landmarks, forward fire and drone formations affect the feel of a sweep.

### Compare pitched explosions

The player bolt makes a short descending zap. The aimed raider round has a longer rising cue. Scouts and raiders explode one octave down, carriers two octaves down. Each explosion has two damped echoes. For an A/B comparison, use `?pitch=0&echo=off` for the original explosion mix, or set `pitch=-12` or `pitch=-24` to use one pitch across all hulls.

See the [power-up design study](docs/power-ups.md) for the next carrier experiment.

Fly over a procedurally laid-out neon district. Rooftops and service streets pass under the fighter, growing in perspective toward the bottom. The parallax switch also controls the city.

The **Warden** enters after 40 seconds and takes over the arena. Its hull meter sits above its wings. Short pink traces announce an aimed three-shot fan. At half hull the fan widens to five. Missiles deal triple bolt damage. Defeat it to resume carrier passes with your upgrades. [Jump to the boss with the starter gun](https://funkatron.github.io/Shmup/?encounter=boss).
