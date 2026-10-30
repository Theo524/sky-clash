# Animation Studio: Mixamo and Rokoko collections

## Browse independently

Animation Studio now has four **source** tabs:

- **All** shows every imported animation together without changing ownership or IDs.
- **Mixamo** shows the original Sky Clash Mixamo FBX/ZIP imports.
- **Rokoko** shows the new Rokoko imports, including the user's **Superhero.zip**.
- **Other** keeps unidentified and loose FBX files separately rather than assuming they are Mixamo.

There are **two independent filters**: source library + **All packs** dropdown, and the existing movement/combat/kicks/etc. animation type filter. The **Rokoko · Superhero** pack can therefore be viewed by itself, or alongside other Rokoko packs later. Cards and the selected-animation inspector show the source identity.

## Import the already supplied Superhero pack

1. Open https://theo524.github.io/sky-clash/animation-studio.html after merging the PR.
2. Click **Import Rokoko Pack** and select the original **Superhero.zip** from your device.
3. Select the **Rokoko** tab, then choose **Rokoko · Superhero** in **All packs**.
4. Click any animation to preview it in the original 3D viewer before assigning it to Kairo.
5. **All** shows both Mixamo and Rokoko. The separate type filter still groups motions by combat, jumps, movement, etc.

The nine source FBX names in this supplied Superhero pack are:
Hawkeye_Archery_mixamo, HulkTransformation_mixamo, IronMan_Combat_mixamo,
SuperHeroFlying_mixamo, MutantClaws_mixamo, LaserEyes_mixamo,
SuperHeroLanding_Takeoff_mixamo, Telekenisis_mixamo, WatchOverCity_mixamo.

The suffix `_mixamo` means the export uses a compatible rig convention,
**not that the source animation came from Mixamo**. File provider detection uses
archive/source metadata and an explicit Rokoko import override, never bone names.

The original ZIP is saved **in the user's browser only**, using the current
IndexedDB motion library. After reload, the archive is reopened under the same
source collection. Existing Mixamo assignments, saved Kairo Base v1, public
animations, and live game behavior are unchanged. The full Rokoko ZIP is **not**
committed to the public GitHub repo.

The other ~700 MB pack exceeds Studio's current **350 MB per ZIP import** cap
and the private cache's **400 MB total** limit. Extract a few desired FBX clips
locally, then use **Import Rokoko Pack** to classify them correctly.
Do not rename an unknown full archive to Superhero.zip to force classification.

## Verification

- Unit tests require the canonical Superhero archive and its `_mixamo`
  files to classify under **Rokoko**, while the four old Sky Clash archives
  remain **Mixamo**.
- IndexedDB tests require metadata and exact original filenames to survive
  restart without changing action IDs.
- Real Chromium Studio test imports separate test ZIPs, verifies counts
  in **All**, **Mixamo**, and **Rokoko**, checks Superhero pack filtering,
  reloads the page and verifies both original ZIPs persist and that action
  assignments remain unchanged.
- No unapproved vendor FBX is published, auto-baked or assigned to game actions.
