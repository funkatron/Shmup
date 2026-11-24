# Agent log

Record meaningful changes, the reason for each decision, what was verified, and what still needs a playtest. Dates below use the project owner's local date. Each build displays its own UTC timestamp.

## 2026-11-19 · Flight and vector display · PR #1

| Build | Decision and evidence |
|---|---|
| `c7aca8a` → `860c286` | Established a 360 × 480 playfield. Edward loaded the build on iPad through Termius and confirmed the Lite 2 was detected. The first 180 px/s D-pad pass felt a little slow. |
| `77fa5ff` → `053221b` | Raised speed to 210 px/s. Added version, commit, build time, and speed above the playfield so feedback can identify the running build. |
| `c80da60` | Added scrolling ground marks and held forward fire. Two horizontal sweeps in Edward’s reference clip gave an estimated 185–190 px/s when scaled to our playfield. Edward liked 210 px/s with the visual cues present. Keep that setting as the playtest baseline. [M.U.S.H.A. movement reference at 9:00](https://youtu.be/mYg2Bt4L1go?t=540) |
| `9813309` | Added one repeatable crossing target. Simulated checks covered hits, misses, and respawn. Edward reported the iPad test worked well. |
| `d80388a` | Added wireframe canyon walls, traced ships, a tight glow, and a magenta shot aimed once per pass. The TypeScript check and production build passed. An offscreen render and simulated inputs covered the visual composition, fixed aim, repeat firing, and player-hit feedback. |
| Documentation | Added setup and controls for players, contributor guidance, and this log. [PR #1](https://github.com/funkatron/Shmup/pull/1) |

**Visual feedback.** Edward’s first impression of the current presentation was “This looks pretty good.” Keep the vector treatment as the visual baseline.

**iPad visibility check.** Edward confirmed he could see both the crossing target and its incoming magenta projectile against the canyon. The ship’s bright core during a diagonal turn remains an open playtest question.

### Vector-display references

- **Atari, Star Wars Operator’s Manual (TM-225).** The self-test section’s grid pattern (Figure 2-9) and intensity test give concrete examples of colored straight lines, convergence, and intensity on the arcade display. They informed our palette and black field. [Operator’s manual](https://www.vernimark.com/arcades/wp-content/uploads/2018/04/starwars_tm225.pdf)
- **Wells-Gardner 6100 Vector Monitor FAQ and Guide.** The discussion of X/Y deflection and Z-amplifier intensity explains how a beam traces lit segments and blanks between them. We use separate paths for disconnected lines and vary brightness between scenery and gameplay. The halo width and falloff are our visual approximation for an LCD. [Technical guide](https://www.coinopstuff.com/manuals/wells-gardner-6100-faq-and-guide.pdf)

## 2026-11-19 · Musha Aleste reference study · PR #1

Examined the supplied recording in timed frames, identified the Stage 1 source from the playback overlay, and checked the flight, weapons and formation rules against the manuals. The two sweep estimates above belong to the uploaded Stage 1 passage. The 9:00 link points to a separate video. The study links both recordings, both manuals, the mechanics reference and the Compile team interview. The next playtest proposed is a single dim crossing landmark at the established 210 px/s. [Research and measurement notes](../docs/musha-aleste.md)

## 2026-11-19 · Canyon bridge playtest · PR #1

Added a segmented blue bridge to one scrolling canyon strip. It follows the floor at 70 px/s and returns every 640 logical pixels (about 9.1 seconds). The rails break across the center to leave dark space around the pilot. The default preview includes the bridge. Append `?bridge=off` for the comparison. [Stage 1 movement study and sources](../docs/musha-aleste.md)

- [x] TypeScript check and production build passed.
- [x] Simulated 20 seconds at 60 Hz in both modes. Verified the bridge follows its strip, wraps twice offscreen, and yields identical actor and projectile states with held fire.
- [ ] Check perceived speed and magenta-shot visibility on iPad Safari with the Lite 2. Local Chromium could not launch in this environment, so the rendered comparison is pending.

## 2026-11-20 · Lite 2 controls · PR #1

Start (+) toggles pause on a fresh press. The scene keeps polling the pad while gameplay and burst tweens are paused. The left stick uses eight equal direction sectors and a 30% radial dead zone. The D-pad has priority when it supplies a direction. Both use the established 210 px/s movement.

- [x] TypeScript and Pages production build passed. Simulated all eight stick directions, neutral drift, held Start, frozen scene state and resume.
- [ ] Confirm Start and left-stick mapping on the physical Lite 2 in iPad Safari.

Edward reported “Working great” after the Lite 2 controls update. Use this flight tuning as the baseline for encounter design.

## 2026-11-20 · Automatic Pages previews

Pushes to controller-flight signal the build on main, which is authorized by the existing Pages environment rule. The README links the public preview. GitHub Actions builds the current branch head and prints its commit in the game.

## 2026-11-20 · Carrier pickup encounter · PR #1

Added the green cargo carrier proposed after the flight test. It crosses right to left below the raider every ten seconds. A bolt releases a hollow chip that drifts down and sideways. Catching it produces a gold flash. [Movement and pickup reference](../docs/musha-aleste.md)

- [x] TypeScript check and Pages build passed. Simulated held fire, chip drop, drift, pickup flash and next carrier pass.
- [ ] Confirm the carrier and chip are distinguishable during a sweep on the iPad.

**iPad playtest feedback on `bfb7a6c`.** Edward interpreted the chip as a power-up and aggressively pursued it. The expected reward gave him a reason to leave his firing lane. Edward could track the magenta shot and take evasive action during pursuit. He enjoys the chaos of a target-rich screen, and can lose track when it gets busy. For a first density test, try a short flight of shootable targets during the chip chase with the same raider firing pattern. Check whether he can still see a way out.

## 2026-11-20 · Parallax and scout formation · PR #1

Edward asked for geometric op-art and enjoys pursuing a pickup through a busy screen. Six dim violet traces on each bank change spacing at each fold. They scroll at 24 px/s behind the 70 px/s canyon. The asymmetry and open center give the player a place to reacquire the cyan ship. The five orange scouts follow one shallow arc, staggered by 0.38 seconds. Only the raider fires. See the [vector display references](#2026-11-19--flight-and-vector-display--pr-1) and [flight study](../docs/musha-aleste.md).

- [x] TypeScript and Pages production build passed. Simulated tile coverage across wraps, scroll rates, pause/resume, matching encounter timing with parallax disabled, three scout formations, hit persistence, respawn, and raider fire count.
- [ ] On iPad with the Lite 2, pursue the chip during the wave and check whether the magenta diamond stays readable where the two banks overlap.

## 2026-11-20 · Opposing scout flight · PR #1

Edward found the parallax and five-scout pass more exciting and asked for higher intensity. Four additional scouts enter from the right 2.55 seconds into the carrier cycle. They move at 148 px/s on a lower arc, facing their direction of travel. The first flight moves at 102 px/s. Both clear around 6.2 seconds, leaving time to collect the chip and follow the raider's shot. [Previous playtest and design references](#2026-11-20--parallax-and-scout-formation--pr-1)

- [x] TypeScript and Pages production build passed. Simulated overlapping flights, the gap before the next pass, hits on returning scouts, reset, pause and enemy shot count. PR review and inline-comment lists were empty.
- [ ] Check on iPad whether switching firing lanes to catch the faster scouts still leaves time to spot the incoming diamond.

## 2026-11-20 · Mirrored encounters, deeper terrain and impact feedback · PR #1

Edward found the incoming diamond harder to track on build 194d24b and enjoyed that tension. Alternate ten-second encounters reflect all enemy paths. A slow floor (18 px/s), mid-distance walls (70), and projecting shelves (148) strengthen the sense of height along the edges.

The supplied 15.87-second Stage 1 recording contains stereo audio. In its 8–12 s passage, the 60–240 Hz band peaks roughly 9 dB above its median near 9.1 s (mono mix, Hann-windowed FFT). Music, fire and impacts overlap. This is a mixed-track measurement. The synth settings are original tuning choices. [Clip timing and source](../docs/musha-aleste.md) · [VICIOGAME gameplay index](https://viciogameblog.com/2022/06/24/genesis_musha_aleste_complete_gameplay/)

A falling pitch and noisy attack feed a 5-bit, 8 kHz sample-and-hold mixed with an uncrushed body. Hull size determines pitch, decay and fragment count. Paired red-orange and blue broken line traces separate briefly around the wreck, behind gameplay actors. The chip and player hit retain their distinct existing feedback.

- [x] TypeScript and Pages production build passed. Simulated original, mirrored and returning passes, hull-specific effects, both color traces, tween cleanup, finite audio buffers with quiet endings, and mute.
- [ ] Check sound unlock and bass audibility on iPad speakers. Follow the green chip through a carrier breakup to assess the local color split.

## 2026-11-20 · Explosion timbre · PR #1

Edward liked the low thud on e898ab7 and described the attack as a balloon pop. Shortened the pitch sweep, gave the crushed noise its own low-mid rumble, and added a quieter second knock that scales with hull size. The carrier now lasts 390 ms with its second attack about 94 ms in. [Original impact reference](../docs/musha-aleste.md)

- [x] TypeScript and Pages build passed. Generated all three hull buffers at 44.1 and 48 kHz and checked sample peaks, finite output, and quiet endings.
- [ ] Listen on iPad for hull breakup during a carrier kill and for distinct scout hits during sustained fire.

## 2026-11-20 · Explosion reverb · PR #1

Edward liked the carrier's low thud and wanted a longer explosive decay across the three hulls. Re-examined the mixed audio from the [Stage 1 reference clip](../docs/musha-aleste.md). Music and effects overlap, so the decay settings are playtest choices. Four damped feedback paths build a diffuse return after the initial 30 ms. Scout, raider and carrier decay settings are 0.48, 0.78 and 1.25 seconds.

- [x] TypeScript and Pages build passed. Rendered all hulls at 44.1 and 48 kHz, verified the original attack, signal after the dry hit, taper to silence and peak headroom in each individual sample. Rendered a matched carrier A/B with the same noise seed and gain.
- [ ] Listen for the tail on iPad, especially when multiple scouts break apart.

## 2026-11-21 · Ship breakup references · PR #1

Edward tentatively identified 011–013 in his numbered M.U.S.H.A. sound-test capture as ship explosions. The first isolated plays begin at 0:34.87 (011), 0:36.80 (012), and 0:38.20 (013). Their measured active spans are about 0.87, 0.18 and 0.88 seconds. The scout draws on 012's short bright strike, the raider on 011's uneven surges, and the carrier on 013's bass body. The declining high-frequency content of 029 at 1:45.31 informed the darkening noise return. The reference informed synthesis only. Each ship uses fresh synthesized noise on first use and the same cached buffer for subsequent hits.

- [x] Built the Pages bundle, type-checked, and rendered all hulls at 44.1 and 48 kHz. Checked individual peaks and quiet endings. The audition uses game gain and includes space for the tails.
- [ ] Check closely spaced scout kills and the carrier tail on iPad speakers.

## 2026-11-21 · Low-mid explosion body · PR #1

Edward wanted more low-mid weight in the previous audition. Applied a broad 300 Hz bell before the reverb and output saturation. The scout gets 3 dB of EQ gain, the raider 6 dB and the carrier 8 dB. At matched full-buffer RMS, a fixed-seed render gained 2.2, 3.7 and 4.3 dB respectively in the 200–400 Hz band.

- [x] TypeScript and Pages build passed. Checked individual buffers at 44.1 and 48 kHz for finite samples and headroom. Rendered same-seed old/new pairs at matched RMS.
- [ ] Audition overlapping explosions on iPad speakers.

## 2026-11-21 · Scout breakup and diffuse tails · PR #1

Edward heard a typewriter in the scout and metallic ringing in the reverb. The scout now has three overlapping noise bursts, a lower body and slight per-hit speed variation. Replaced the four recirculating delays across all hulls with a diffuse filtered-noise tail driven by the dry signal’s energy. The 300 Hz hull EQ remains in place.

- [x] TypeScript and Pages build passed. Rendered old/new scouts, five successive kills, and isolated larger hulls through the playback path at 44.1 and 48 kHz. The overlapping audition stayed below full scale.
- [ ] Check the new scout in a wave and the carrier decay on iPad speakers.

## 2026-11-21 · Octave and delay audition · PR #1

Added opt-in half-speed and quarter-speed playback of the existing hull sounds. An optional low-passed echo taps the impact at 145 and 325 ms, at 24% and 10% gain. Delays are scaled in the cached buffer so octave changes preserve echo timing. The scout retains its small per-hit speed variation.

- [x] TypeScript and Pages build passed. Rendered all three ships at both pitches through the playback path with matched noise seeds for the echo comparison. Checked finite, unclipped audition output.
- [ ] Compare scout overlap and carrier weight on iPad speakers.

## 2026-11-22 · Combat audio and power-up study · PR #1

Promoted the octave audition to the normal game mix. Scouts and raiders use half speed and carriers quarter speed, with the two damped repeats. Added a 65 ms descending player bolt and a 210 ms rising raider projectile cue, triggered at launch and cached under the existing sound toggle.

- [x] Production Pages build and TypeScript check passed. Exercised both launch sounds and three explosion buffers at 44.1 and 48 kHz, checked individual samples for headroom, and verified mute gating and bolt buffer reuse.
- [ ] Audition sustained fire over the carrier tail on physical iPad speakers. Check whether the incoming cue remains recognizable with eyes on the ship.

The [power-up study](../docs/power-ups.md) links the original Musha Aleste and Blazing Lazers manuals and proposes a first-chip reward for the existing carrier.

## 2026-11-22 · First carrier chip equips a wing pod · PR #1

Implemented the [first-chip experiment](../docs/power-ups.md). The hollow cyan pod adds a parallel bolt to the right of the fighter. Both bolts use the existing enemy collision logic. Repeat pickups preserve the single pod for the flight.

- [x] TypeScript and production build passed. Simulated single fire, chip collection, a two-bolt volley, a carrier kill by the offset bolt alone, repeat collection and one sound per volley.
- [ ] On iPad with Lite 2, hold fire through the pickup and judge whether the second lane is easy to use during a scout crossing.

## 2026-11-22 · Twin pods and spread fire · PR #1

Extended the [carrier-chip progression](../docs/power-ups.md). Chip two equips the left pod. Chip three tips both outer lanes outward by 12 degrees. All levels retain the center shot, firing cadence and one cue per volley.

- [x] TypeScript and Pages build passed. Simulated all four formations, a fourth pickup at the cap, firing cue counts and a carrier hit from the angled left lane.
- [ ] Try the third pickup during the mirrored scout pass on iPad with the Lite 2. Check whether targets remain easy to track between the outer lanes.

## 2026-11-23 · Fourth-chip homing missiles · PR #1

Edward wanted a bloom that opens at 45° and narrows toward a target. Chip four adds a pair to the three-bolt spread, initially coasting outward before steering toward the nearest enemy ahead. A short mint tracer follows each actual path. Missiles run on a separate cooldown to give each pair room to read.

- [x] TypeScript and Pages build passed. Simulated all four chip pickups, the five-projectile launch, opposing launch angles, outward travel and missile cleanup.
- [ ] Check tracer shape and incoming-shot visibility during a busy scout wave on iPad.

## 2026-11-23 · Lower-city parallax · PR #1

Added four horizontally wrapping vector strips below the flight path. The skyline, signs, elevated rail and roof aerials move at 6, 17, 34 and 60 logical pixels per second against the vertically scrolling canyon. Their scene clock freezes on pause. Test the lower edge during a carrier chase on iPad.

- [x] TypeScript and production build.
- [ ] Physical Lite 2 and iPad readability check.

## 2026-11-23 · City overflight · PR #1

Replaced the side-on skyline with a projected street grid beneath the entire route. A moving nine-row window generates consistent buildings from block and lot coordinates. Roof heights produce different projected speeds, and the avenue bends between blocks. The original scrolling canyon banks sit above the district.

- [x] TypeScript and production Pages build passed.
- [ ] Physical iPad readability and frame pacing during a full missile volley.

## 2026-11-23 · Warden boss · PR #1

A 48-hit vector gunship takes over the city after four carrier passes. Its charge traces show the incoming fan directions. Half hull adds two outer rounds and shortens the interval. Destruction clears incoming shots and restores the carrier encounter. The README links a direct boss playtest.

- [x] TypeScript, production build and simulated scene combat. Verified entry, three-shot attack, half-health transition, expanded fan, defeat and wave resumption.
- [ ] Test attack readability and sustained aim on iPad with Lite 2.

## 2026-11-23 · Encounter audio · PR #1

Reviewed the [numbered sound-test catalog](https://chatgpt.com/library?file_id=libfile_bcb5557bfdf08191aa362ef727825738&account_id=personal) from Edward’s recording. These are original synthesized cues. The mappings describe our game design, rather than confirmed uses in M.U.S.H.A.

| Event | Reference and adaptation |
|---|---|
| Collect chip | 022 stepped rise. Four short ascending pitches cut through firing. |
| Launch two missiles | 004 falling whistle. One descending, gritty sweep per pair. |
| Warden locks aim | 006 rising rush. Compress the climb to 610 ms inside the 650 ms warning. |
| Incoming projectile hits fighter | 019 stubby low strike. One crunchy pulse per collision frame. |

- [ ] Check warning audibility during held fire and pickup clarity on physical iPad speakers.
- [x] TypeScript, production build, simulated Warden fight, and 48 kHz buffer checks for signal, peak level, reuse and mute.

## 2026-11-23 · Flight feedback · PR #1

Sound defaults on and remembers an explicit mute. A playfield tap retries suspended audio on browsers that gate playback. Start opens a fixed pause overlay with projectile accuracy, total kills, Wardens, chips and incoming hits. A pickup grows 25% and brightens over half of its 900 ms cycle. Its collision radius remains 13 logical pixels.

- [x] TypeScript, production build and simulated audio/flight checks covered mute preference, gesture retry, two-projectile accuracy, pickup, kill, hit and pause/resume.
- [ ] Check initial audio activation and pickup visibility on physical iPad with Lite 2.

## 2026-11-23 · Earlier spread and growing missile volleys · PR #1

Edward wanted chip two to unlock spread and every pickup after missile unlock to matter. Chip three equips the first missile pair. Each subsequent chip adds a left and right missile inside the 45° fan.

- [x] Simulated pickups from zero through ten chips, checking spread angles, missile counts, unique launch lanes and projectile statistics. TypeScript and production build passed.
- [ ] Check tracer readability and frame pacing with several missile pairs on the physical iPad.

## 2026-11-24 · Independent missile locks · PR #1

Each missile selects from its own position at launch and when it loses its lock. Prioritize enemies with the fewest active locks, then distance. Keep valid locks through the turn.

- [x] TypeScript and production build. Simulated six launches across three scouts, an empty field and four launches against a lone Warden.
- [ ] Check split tracer paths during a scout crossing on iPad with the Lite 2.

A coral twin-tube frigate crosses each ten-second wave. Its pink missiles snapshot the fighter position at launch and use the straight enemy-projectile movement path. The frigate can be destroyed or acquired by friendly missiles.

- [x] TypeScript, production build and simulated twin launch with a subsequent fighter sidestep.
- [ ] Playtest the dodge during a carrier pass on iPad.

## 2026-11-24 · One-finger flight · PR #1

Edward had no controller available. Holding the canvas fires, and dragging from the touch origin steers with proportional speed up to the controller speed. Release stops both. A header button opens the existing pause and statistics view.

- [x] TypeScript, production build and simulated controller-free firing, half-speed steering, cancellation and pause/resume.
- [ ] Physical iPad Safari touch feel and audio unlock.

## 2026-11-24 · Crossing fire over the city · PR #1

Sampled frames across Edward’s 16-second [M.U.S.H.A. reference](https://youtu.be/mYg2Bt4L1go?t=540) and the official Steam trailers for [Ikaruga](https://store.steampowered.com/app/253750/), [DoDonPachi Resurrection](https://store.steampowered.com/app/464450/) and [Crimzon Clover](https://store.steampowered.com/app/1718160/). The clip shows the fighter sweeping beneath a bridge and incoming fire. Ikaruga’s opening formation, the repeated projectile lanes in DoDonPachi, and Crimzon Clover’s multi-target lock-on sequences informed our second pair of crossing flights.

The ten-second pass now sends 20 scouts in four formations. Leaders aim one three-way fan each and withhold fire inside 90 logical pixels. Late flights cross at different heights while the frigate is active. The Warden telegraphs five rounds, then seven below half hull (including the half-hull threshold). Its warning still lasts 650 ms.

- [x] TypeScript and production build. Simulated a full untouched pass, 20 scout entries, 16 hostile projectiles, the boss transition, both boss fans and one-finger steering/fire.
- [ ] Judge pickup readability and missile-heavy frame pacing on physical iPad.

## 2026-11-24 · Warden hull damage · PR #1

Doubled the hull from 48 to 96 HP. Each quarter lost replaces intact vector panels with persistent jagged traces, first on the left wing, then the right, then the core. The meter retains twelve segments and the seven-round attack begins at half hull.

- [x] TypeScript, production build and simulated 96 bolt hits, including all damage stages, defeat and a fresh hull on re-entry.
- [ ] Check damage readability during sustained fire on physical iPad.

## 2026-11-24 · Audible Warden damage · PR #1

Edward confirmed the hull damage is visible. Each change of hull texture now triggers a cached sound through the existing mute control. The wing crack is short and noisy, the second breach descends in steps, and the core rupture has the longest low-mid tail.

- [x] TypeScript, production build and simulated full fight. Sustained bolt hits triggered exactly three damage cues at 72, 48 and 24 HP.
- [ ] Audition the transitions over sustained fire on physical iPad speakers.

## 2026-11-24 · Cannon and accelerating missile volleys · PR #1

Player bolts use a short crushed-noise crack over a low impact. Missile launches use a half-second rising turbine and brightening exhaust, once per salvo. Missiles begin at 145 logical px/s, gain 440 px/s each second to a 480 px/s ceiling, coast outward for 0.28 s and keep 0.50 s of trail. Extra pairs open the fan by 7° per side up to 75°, then fill intermediate lanes.

- [x] TypeScript and production build, synthesized buffers and cache reuse, simulated three-pair launch angles, acceleration to cruise and trail history.
- [ ] Judge cannon/engine balance and bloom visibility on iPad during continuous fire.
