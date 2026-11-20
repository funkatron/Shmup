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
