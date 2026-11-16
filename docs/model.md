# The model

How the app decides what a chord is doing, where to draw it, and which moves to offer. These are rules of thumb
from functional harmony, picked to be useful while improvising. The code is in `js/theory.js`, `js/voices.js`
and `js/maps.js`.

Throughout: a chord is a root `r` (a pitch class, 0 to 11) and a quality `q`; the home key is a tonic `t` and a
mode, major or minor; `d = (r - t) mod 12` is the chord's degree in semitones above the tonic.

## Jobs

Every chord gets one of three jobs (`fn`). The first rule that fits wins.

1. A dominant-type chord (dominant seventh, augmented, sus4) **pulls**. The tonic sus4 **rests**.
2. A diminished chord **pulls**, except the diminished triad or half-diminished seventh on the second degree,
   which **drifts** (it is the ii of minor).
3. A major chord with a major third on degree 2, 4, 9 or 11 (in minor: 2 or 4) **pulls**: II, III, VI and VII
   act as dominants of other chords.
4. A minor chord on degree 7 (the minor v) **drifts**.
5. Otherwise the degree decides:

| d | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| job | rest | drift | drift | rest | rest | drift | pull | pull | drift | rest | drift | pull |

*Home* is the tonic chord itself. The colours follow the jobs everywhere: umber for rest, slate blue for drift,
vermilion for pull.

## Distance from the key

`ring` says how far outside the key a chord is.

- **0**: every note of the chord is in the key's scale (for minor: natural minor plus the raised seventh).
- **1**: every note is in the scale of the parallel mode (a borrowed chord), or the chord is a dominant whose root
  is a fifth above a chord of the key (a ramp), or a diminished chord a half step below one.
- **2**: anything else.

## Distance from rest

The profile plots `lift`: 0 for home; otherwise 0.8 for rest, 2.2 for drift, 3.6 for pull, plus 0.8 per ring,
plus 0.6 if the chord contains a tritone.

## The Roads map

Three regions, one per job: Away (top left), Tension (top right), Home (bottom). The arrows between them are the
usual round trip: leave, build, resolve.

Inside a region a chord's position has two meanings.

- **Row**: its ring. Ring 0 is the row facing the middle of the map; ring 2 is the outer rim.
- **Left to right**: its brightness. Give every note a place on the line of fifths counted from the tonic
  (F is -1, C is 0, G is +1, D is +2, and so on). A chord's brightness is the average place of its notes: the
  root's place plus an offset for the quality (major triad +5/3, minor triad -2/3, dominant seventh +0.75,
  major seventh +2.5, minor seventh -1, diminished triad -3, and so on). Flatter is darker and sits left.

Each region has its own left-to-right scale, and long empty stretches are shortened, so brightness compares
within a region and not across regions.

A fixed set of chords is always drawn (the chords of the key, the usual borrowed chords, and the ramps). Any other
chord you reach gets its own circle at its computed place, slid along its row until it is clear of its neighbours.

## The Wheel and the Lattice

The Wheel is the circle of fifths with the home key at the top: major chords on the outer ring, their relative
minors inside, diminished chords at the hub. On a diminished seventh it draws a square through the four keys the
chord can lead to.

The Lattice is the tonnetz: fifths run left to right, thirds run diagonally. Triangles pointing up are major
triads and triangles pointing down are minor. Two triangles that share an edge share two notes.

## Moves

`moves(chord)` returns the groups shown in the list of moves.

- **Follow the road**: a small table of where each chord of the key usually goes. A ramp goes to the chord it
  aims at, to that chord's deceptive substitute, or down a half step.
- **Change one note**: the three triads that share two notes with this one (parallel, relative, leading-tone
  exchange). From a diminished seventh, the four dominant sevenths made by lowering one note.
- **Borrow**: the chords of the parallel mode.
- **Aim at a chord**: the dominant seventh a fifth above each chord of the key.
- **Slide a half step**: a dominant seventh a half step above the next chord on the road (the tritone substitute
  of its dominant), a passing diminished seventh to the chord a step above or below, or the same chord a half
  step away.
- **Leap a third**: the same quality a minor or major third away, or a tritone away.
- **Mirror it**: reflect every note `n` to `(2t + 7 - n) mod 12`. In C this swaps C with G, E with E flat, and
  turns G7 into F minor 6.

## Voices

A chord on the path can carry the exact notes it was left on: a bass note and the right hand's notes.

- **One finger a half step** changes one of those notes. The new sonority is named from the bass up: a known
  chord in root position if there is one, otherwise an inversion or a chord over a foreign bass, otherwise a
  literal name built from the intervals.
- **Slip there by half steps** sends each finger to the nearest note of the target chord without crossing, then
  plays the moves one at a time, preferring the order that passes through the plainest chords. It is offered when
  the trip takes five half steps or fewer.
- **Home and pull** is Barry Harris's sixth-diminished scale. A major sixth chord (C E G A) and the diminished
  seventh a half step below its root (B D F A flat) hold eight notes between them. Moving every voice to the next
  note of that scale alternates the two chords: home, pull, home, pull. The same diminished chord leads to four
  sixth chords a minor third apart.

## Voicing

When a chord has no fingering of its own, the left hand takes the root and the right hand takes the chord in the
position that moves the fingers least from the chord before, within about two octaves around middle C.
