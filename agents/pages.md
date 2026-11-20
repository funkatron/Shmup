# GitHub Pages playtest

2026-11-20 · Raiden was offline. Edward approved public hosting. The manual Publish Shmup playtest workflow on main builds controller-flight with Node 24. In Settings → Pages choose GitHub Actions. In Actions run the workflow using main. After the publish job succeeds, open its environment URL on iPad and compare the displayed build ID with the game source commit. Use `?bridge=off` for the alternate canyon preview.

Verified the local production build for `/Shmup/`, its bundled asset path and the embedded game commit `cddc12a`. Public deployment and iPad confirmation are pending.
