# Sky Clash V57 — Animation Studio

## What works
- Import individual FBX animations or ZIP archives holding many FBX files, including files with repeated display names.
- Browser-local ZIP extraction using JSZip, with 500-item and size limits.
- Automatically render eight actual motion snapshots per visible clip; cycle through them as animated thumbnail previews.
- Search, category filters, paging (16 clips per page), hover, select and full 3D mannequin preview.
- Drag orbit camera, zoom, pause/play, speed, scrub and root travel toggle.
- Drag clips into Kairo/Rin candidate bins or click assignment buttons; local save and export JSON.
- No change to combat or VRM retargeting; preview shows the animation's own original Mixamo skeleton.

## Notes
The page uses the same Three.js release as the game (r158) but an isolated ES module and renderer, loading the official Three.js FBXLoader via jsDelivr. Preview requires access to CDN modules. The JSZip library is locally bundled under its open-source license. FBX data stays in the browser and is not transmitted. Browser localStorage only saves shortlist metadata; reimport ZIP / FBX files to preview in a later session.

**Safety and limitations:** FBX files can be very large and unusual skeleton layouts will fail. The previewer supports Mixamo humanoid animation FBX files with valid embedded skeletons. Gallery is paged and generates thumbnails only for visible clips. It does not directly assign source FBX animations to actual game moves, retarget to VRM0 or VRM1, edit mesh geometry, or automatically save imported files.
