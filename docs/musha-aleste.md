# Musha Aleste flight and encounter study

## Which footage?

Edward supplied a 15.87-second, 736 × 512 screen recording at 30 frames per second. Its player overlay at 13.65 seconds identifies VICIOGAME’s Stage 1 at **4:58**, with ARM LEVEL 1 and FORM-ROLL on the HUD. The times below are relative to the start of Edward’s recording. The separate 9:00 link is a general reference. These measurements come from the upload. [Stage 1 passage, around 4:45](https://www.youtube.com/watch?v=VMbzgsdRDxA&t=285s) · [Separate 9:00 reference](https://youtu.be/mYg2Bt4L1go?t=540)

## What makes the sweep readable?

| Clip time | What to watch |
|---|---|
| 0–2 s | The mech fires up the screen. Successive bright groups mark its firing lane. The red bridge enters from above while the riverbanks move downward along the edges. You can see forward travel even when the pilot holds a lane. |
| 2–4 s | The pilot sweeps right across the approaching bridge. Earlier volleys are still visible higher up in the lanes where they were fired. The bridge acts like a ruler across the entire field for a moment, then passes beneath the mech. |
| 4–7 s | The pilot reverses and traverses toward the left bank. The string of separated volleys shows the change of direction. The ship can leave a lane immediately while its fire continues working farther up that lane. |
| 8–13 s | Bright round effects appear over the darker river, a second bridge passes, and the pilot shifts from side to side with room to spare. The dark central area gives the eye somewhere to pick up small moving objects amid the bank detail. |

**Distance and time.** Exclude the side artwork and measure the center of the mech relative to the playable width. Two short, predominantly horizontal runs, around 2.6–3.1 s and 5.2–5.6 s, cover approximately 26% and 21% of the field. That is about 0.52 field widths per second, or roughly 185–190 logical px/s in our 360-wide field. These are rounded screen-space observations from recorded playback. The selected speed, controller transitions, diagonal normalization, hardware timing, and exact collision box cannot be recovered from these two runs.

## Mechanics that change how the pilot moves

- **Flight speed is selectable.** The D-pad steers in eight directions. While paused, the player can adjust movement speed. A particular run therefore measures a particular pilot setup. [Japanese manual, controls and options](https://www.sega.jp/mdmini/manual/pdf/m_jp_musha.pdf)
- **Forward fire makes positioning count.** Holding the main gun produces a stream. Chips upgrade the main gun, adding columns of fire. A crossing run distributes that fire over several lanes. Holding position concentrates it. The HUD’s ARM LEVEL describes the separate special weapon. [US manual, Basic Controls and Weapons](https://www.retrogames.cz/manualy/Genesis/MUSHA_-_Genesis_-_Manual.pdf) · [Shmups Wiki, main weapon and items](https://shmups.wiki/library/Musha_Aleste)
- **Pickups create a reason to cross exposed space.** Chip carriers release chips when shot. Every three collected chips earn a drone. Two can fly at once, with spares held in reserve to replace losses. Chips still have value after the main gun is fully powered. [Shmups Wiki, items](https://shmups.wiki/library/Musha_Aleste)
- **Formation changes which way the same maneuver attacks.** Forward concentrates both drones ahead. 3-Way covers the forward diagonals. Back covers the rear. Reverse fires opposite the pilot’s movement. Roll circles the mech and sweeps fire around it. Free sends drones to pursue targets. The recording shows Roll, so some nearby motion continues independently of the pilot’s steering. [Japanese manual, drone formations](https://www.sega.jp/mdmini/manual/pdf/m_jp_musha.pdf)
- **The three specials change the shape of a safe approach.** Blue fires a forward beam. Red throws a bomb whose blast can clear enemy shots. Green puts a damaging, protective energy sphere around the mech and can send it forward. Repeated pickups of the equipped type increase its level, to IV. Switching types preserves the attained level. An equipped special absorbs a hit at the cost of the weapon. [Japanese manual, special weapons](https://www.sega.jp/mdmini/manual/pdf/m_jp_musha.pdf) · [US manual, Weapons](https://www.retrogames.cz/manualy/Genesis/MUSHA_-_Genesis_-_Manual.pdf)

## Depth and our vector prototype

Programmer Yuichi Toyama describes using segmented vertical scrolling for the Stage 3 valley, bringing enemies out of its depths, and changing sound-effect frequency to convey distance when the floor falls away. That account concerns Stage 3. The bridge in the supplied Stage 1 recording illustrates a simpler cue we can use immediately: a recognizable shape crosses a large part of the field and passes beneath the player. [Compile development-team interview](https://shmuplations.com/compilestg/)

Edward liked the current 210 px/s controller setting. That corresponds to 0.58 field widths per second. Keep it as the comparison baseline. For a single-variable playtest, keep the encounter, shot cadence and controls fixed. Add an occasional dim, segmented cross-span between the canyon walls, with dark gaps. Compare the same dodge and return-to-lane maneuver with and without it. Ask whether travel feels faster and whether the magenta incoming shot remains easy to follow as it crosses the span.
