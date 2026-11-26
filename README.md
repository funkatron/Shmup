# Surrender

An original vertical arcade shooter built with Phaser, TypeScript, and Vite. The first playable encounter tests how it feels to sweep across the screen, dodge, and return to a firing lane on an iPad with an 8BitDo Lite 2.

Pushes to `controller-flight` automatically rebuild the [public iPad preview](https://funkatron.github.io/Shmup/). Refresh after the Pages workflow succeeds and check the commit shown above the playfield.

## Flight demo and scoring

[Watch the flight demo](https://funkatron.github.io/Shmup/?mode=demo) to see a power-up collected in live combat. Follow the green ring from the carrier to its dropped chip. The fighter flies through the chip and demonstrates its new twin cannon before the repeating control lessons begin. The highlighted face button follows each lesson on the SN30 Pro. **Play Surrender** starts a fresh scored flight. Every flight opens with a 2.6-second descent from a close side view to overhead.

Each collected chip earns 50 points. Scout, raider, frigate and carrier kills earn 100, 200, 400 and 500 points respectively. Defeating the Super Warden earns 10,000. The score appears above the playfield and on the pause panel.

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

## Stage 1 · Glass Meridian

[Stage storyboard](docs/glass-meridian.svg) · [Play the stage](https://funkatron.github.io/Shmup/) · [Practice the Super Warden](https://funkatron.github.io/Shmup/?encounter=boss)
City blocks keep their landmarks as they scroll. At district boundaries, the next district enters from the top while the previous district passes beneath the fighter. [Four terrain frames](docs/meridian-overflight.svg)
Each district border has an eleven-second approach and exit combined. Twin conduits carry the changing district colors while local landmarks fade along the crossing.
Dock cranes shuttle and lift containers, rail carts follow the diagonals, and reactor spokes rotate. Fly beneath bridges and Crown Gate trusses. The overhead structures are scenery and deal no damage.
Watch the outer pavements for walking pairs. Cars and longer delivery trucks travel in opposite directions along the central avenue.

| Flight time | District | What to watch |
|---|---|---|
| 0–20 s | Neon Port | Magenta dock cranes and moored ferries pass beneath the first two carrier waves. Use the opening to build your cannon and find missiles. |
| 20–50 s | Switchyard | Crossed rails mark the first missile curtains. Amber-pink chevrons announce occupied lanes 850 ms before launch. Fly through the two unmarked lanes. |
| 50–80 s | Arc Reactor | Concentric cyan reactor rings pass beneath double-arc scout runs. Three curtains per pass move the opening across the screen. |
| 80–100 s | Crown Gate | Gold crowns on blue trusses, mirrored flights and the last carriers. Ships break away for the final three seconds. |
| 100 s onward | Super Warden | Twin emitters fire aimed fans. Below two-thirds hull the boss alternates fans and curtains. The last third brings ten-shot fans and faster volleys. |

The rotating crown surrounds a 192-HP hull. Damage cracks persist at quarter-hull intervals. Defeat the boss to bank 10,000 points and see the final score. **Fly again** starts a fresh run.

Patrol Wardens enter around 0:24, 0:54 and 1:24. Each has 10 HP and flashes pale on impact. The Super Warden is 30% larger and growls again as its armor breaks.
