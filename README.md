# Surrender

An original vertical arcade shooter built with Phaser, TypeScript, and Vite. The first playable encounter tests how it feels to sweep across the screen, dodge, and return to a firing lane on an iPad with an 8BitDo Lite 2.

Pushes to `controller-flight` automatically rebuild the [public iPad preview](https://funkatron.github.io/Shmup/). Refresh after the Pages workflow succeeds and check the commit shown above the playfield.

## Flight demo and scoring

[Watch the flight demo](https://funkatron.github.io/Shmup/?mode=demo) to see a power-up collected in live combat. Follow the green ring from the carrier to its dropped chip. The fighter flies through the chip and demonstrates its new twin cannon before the repeating control lessons begin. The highlighted face button follows each lesson on the SN30 Pro. **Play Surrender** starts a fresh scored flight. Every flight opens with a 2.6-second descent from a close side view to overhead.

Each collected chip earns 50 points. Scout, raider, frigate and carrier kills earn 100, 200, 400 and 500 points respectively. Defeating the Warden earns 5,000. The score appears above the playfield and on the pause panel.

## Play the crossing encounter

| Control or cue | What it does |
|---|---|
| On-screen controls | Slide on the left pad to steer in eight directions. Hold B for the cannon, Y for equipped missiles, or both. Tap X to cycle drone formations. |
| Touch and hold the playfield | Fires continuously. Drag away from the initial touch to steer. A shorter drag moves more slowly. Lift to stop, then touch anywhere to recenter. Tap Pause for flight stats. |
| D-pad or left stick | Steer in eight directions at 210 logical pixels per second. Release to stop. |
| Start (+) | Press once to pause and see flight stats. Press again to resume. |
| B · bottom face button | Hold for four volleys followed by two silent steps. Release and press to start a fresh burst. Start with one bolt. The first green chip adds a parallel bolt, the second adds a third parallel lane, and the third adds a fourth lane and increases the firing rate. |
| A · left face button | Fire homing missiles. Each cyan arrow chip adds a pair per volley, up to eight missiles. |
| Violet drone chip | Each live drone automatically fires a short violet beam that strikes the first enemy in its path. Each violet twin-diamond pickup adds one drone up to four, including replacements after losses. |
| SN30 Pro X · top face button | Cycle Ahead → Free → Defensive → Roll → Spread. The formation button does the same on touch. Ahead forms a forward line. Free pursues enemies and aims at them. Defensive covers the ship with a wider interception radius. Roll orbits the fighter. Spread places drones on diagonals. In offensive formations, each drone aims at a distinct enemy marked by a violet ring. Extra drones wait for an available target. In Defensive formation drones lock onto hostile projectiles and shoot them down, acquiring those nearest the fighter first. A drone survives two hits. The third destroys it. Continuous contact with one hull counts once until separation. |
| Red wireframe ship | Crosses every five seconds. A direct hit produces a gold burst. |
| Orange scouts | Four formations cross each carrier pass. Each leader can fire a three-shot fan. Destroy the leader early to cancel its volley. Two higher formations arrive alongside the frigate in the second half. |
| Green cargo carrier | Enters from the right at the start and switches banks every ten seconds. Each new flight starts with the base cannon. Destroyed carriers cycle through cannon, missile, and drone chips. Touch-and-hold fires all equipped weapons. Missiles independently seek the least-targeted enemy ahead and favor the nearest when tied. A lone boss draws the whole volley. |
| Coral twin-tube frigate | Crosses above the raider and launches two pink missiles aimed at your position. Sidestep after launch to dodge. |
| Magenta diamond | A surviving target fires one second into its pass. The shot travels straight toward your position at launch. |

Every other carrier pass mirrors the raider and both scout flights too. Sound starts enabled. If Safari waits for interaction, tap the playfield or **Enable sound** once. The sound button remembers your mute choice on this browser. Scouts crack quickly and the carrier breaks up with a longer, lower thud. A red-orange and blue fringe briefly splits around each wreck. Tap **Sound on** to mute.

To try the dodge, let the target fire first. Move across the diamond’s path, then hold fire and sweep back into position. A hit on your ship flashes and makes a short, crunchy low strike. Play continues. A rising four-note chime marks chip collection, held fire gives a rapid cannon report, each missile volley launches with a rising exhaust roar, and the Warden winds up audibly as its aim traces appear.

Each weapon caps at level 4. With level-four cannon and missiles and four active drones, every additional chip banks one reserve drone. When a drone is destroyed, a reserve launches at full health. Pause to see the reserve count. The pause panel shows all three levels and counts individual bolts and missiles that hit out of all projectiles fired. Destroyed includes Wardens. Chips and incoming projectile hits count each contact. A new page load starts a fresh flight.

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

The **Warden** enters after 40 seconds and takes over the arena. Its 96 HP are shown on a twelve-segment hull meter. The left wing cracks at 72 HP, the right at 48, and the core splits at 24. Listen for a short crack, a stepped crunch and a low falling rumble at those three transitions. Short pink traces announce an aimed five-shot fan. At half hull the fan widens to seven. Missiles deal triple bolt damage. Defeat it to resume carrier passes with your upgrades. [Jump to the boss with the base cannon](https://funkatron.github.io/Shmup/?encounter=boss).

Four colored corner marks identify an enemy tracked by your missiles. Missiles and their trails take the color of their current target. Several missiles can share a lock. The marks disappear when the final lock ends.
