# Diwali Greetings: a Diwali greeting experience

An immersive, scroll-driven Diwali website. You walk from a dark temple into a glowing courtyard, watch the night sky fill with fireworks, open a golden envelope, and then design a greeting card of your own to save, download or share.

**Live site:** https://diwali-greetings-rho.vercel.app

---

## The experience

Scenes 1, 2, 4 and 5 live inside one pinned, scroll-driven stage, so the page never jumps between them. Scrolling plays the story forwards, and scrolling back plays it in reverse.

| Scene | What happens |
| --- | --- |
| **1. The temple** | The screen starts dark. The temple fades in, then the hanging bells and lanterns, then a 3D clay diya whose flame flickers. |
| **2. The rangoli** | As you scroll, the diya lifts off, travels across the temple and settles at the exact centre of the rangoli. It stays there, and returns if you scroll back up. |
| **4. The pull-back** | Four courtyard images dissolve into one another over a long stretch of scroll, as if the camera were drifting back to reveal the palace. |
| **5. Fireworks** | A live fireworks show over the palace, drawn entirely in code on a 2D canvas. It builds as you scroll, and scrolling itself sets off extra shells. It ends with a finale. |
| **6. The envelope** | A 3D envelope waits in the dark. Click it (or the button) and the seal breaks, the flap opens and a greeting card rises out and grows to fill the screen. |
| **7. The greeting studio** | Write a message, pick one of six card designs, preview it live, then open it from an envelope. Download it as an image or share it. Sign in with Google to keep a collection of saved cards. |

Sound plays throughout: soft background music for the whole site, plus a fireworks soundtrack that fades in and out with Scene 5 (the music dips while it plays).

---

## Tech stack

| Area | Tools |
| --- | --- |
| Framework | React 19, TypeScript, Vite |
| 3D | three.js, `@react-three/fiber`, `@react-three/drei` (diya, bells and lanterns, envelope) |
| Animation | `framer-motion` (scroll progress, springs, UI motion) |
| Fireworks | A small custom particle engine on a 2D canvas (`scenes/Scene5/fireworks.ts`) |
| Cards and export | SVG card art sized in container units, exported with `html-to-image` |
| Accounts and saving | Firebase Authentication (Google) and Cloud Firestore |
| Icons | `lucide-react` |
| Hosting | Vercel |

---

## Getting started

**Requirements:** Node.js 20 or newer, and npm.

```bash
git clone <your-repo-url>
cd diwali-greetings
npm install
npm run dev
```

Then open http://localhost:5173.

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check and create a production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

If `firebase` isn't in your `package.json` yet, add it:

```bash
npm install firebase
```

---

## Assets you need in `public/`

```
public/
├── audio/
│   ├── diwali-music.mp3        # background music, plays across the whole site
│   └── fireworks.mp3           # plays only during Scene 5
├── images/
│   ├── temple-dark.png
│   ├── courtyard-rangoli.png
│   ├── courtyard-rangoli-farther.png
│   ├── courtyard-rangoli-farther-1.png
│   ├── courtyard-rangoli-farther-2.png
│   └── courtyard-rangoli-farther-3.png
└── models/
    ├── diya/diya.glb
    ├── lantern/brass_diya_lantern_4k.glb
    └── bell/temple_bell.glb
```

If you rename a file, update the path in the code that loads it. Please also check the licences of any third-party 3D models, images and audio you use.

---

## Project structure

```
src/
├── App.tsx                      # the pinned journey + scenes 6 and 7
├── index.css                    # global styles and the pinned stage
├── lib/
│   ├── journey.ts               # scroll timeline (PHASE) and image geometry
│   ├── sound.ts                 # shared sound on/off switch
│   └── useElementSize.ts
├── components/
│   ├── BackgroundMusic.tsx      # site-wide music + the sound button
│   └── FireworksAudio.tsx       # Scene 5 soundtrack, follows the scroll
├── firebase/firebase.ts         # Firebase setup
├── services/greetingService.ts  # save, load and delete saved cards
├── types/greeting.ts            # greeting data and defaults
└── scenes/
    ├── Scene1/                  # temple, bells, lanterns, 3D diya
    ├── Scene2/                  # rangoli courtyard
    ├── Scene4/                  # the image pull-back
    ├── Scene5/                  # fireworks (Scene5.tsx, fireworks.ts)
    ├── Scene6/                  # 3D envelope and card reveal
    └── Scene7_GreetingCreator/  # editor, templates, preview, saved cards
```

---

## How the scroll journey works

- `App.tsx` builds one tall container (880svh) with a sticky, full-screen stage inside it.
- `useScroll` measures progress through that container, and `useSpring` smooths it. Every scene reads this single value, so the diya, the image dissolves and the fireworks stay in step.
- `lib/journey.ts` holds a `PHASE` table giving the scroll range of each moment: the diya's flight, each image's dissolve, the fireworks ramp, the finale and the exit fade. **To make any transition longer or shorter, edit the numbers there.**
- The diya lives inside the stage. It's placed on screen with the same maths used to size the rangoli image, so it always lands on the rangoli's centre on any screen size. It fades out before the palace images take over.
- Heavy canvases (temple, diya, fireworks) pause when they aren't visible.

---

## Firebase setup

Saving cards needs a Firebase project. The web config is in `src/firebase/firebase.ts`. Firebase web keys are not secrets; your **Firestore rules** are what keep data private.

1. In the Firebase console, enable **Authentication → Sign-in method → Google**.
2. Create a **Cloud Firestore** database.
3. Publish rules so each person can only reach their own cards:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /users/{userId}/cards/{cardId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```

4. Under **Authentication → Settings → Authorized domains**, add your live domain:
   `diwali-greetings-rho.vercel.app`
   (`localhost` is already allowed.) Without this, Google sign-in fails on the deployed site.

Cards are stored at `users/{uid}/cards/{cardId}`.

---

## Deploying to Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel. It detects Vite automatically:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. Deploy. Every push to the main branch redeploys the site.
4. Add the Vercel domain to Firebase's authorized domains (see above).

---

## Sound

- Browsers don't allow sound until a visitor has interacted with the page, and scrolling doesn't count. The site tries to start the music on load; if the browser blocks it, the music starts on the first tap, click or key press.
- A small button at the bottom-left shows "Tap for sound" while sound is blocked, and becomes a mute switch afterwards. The choice is remembered between visits.
- The fireworks sound follows the scroll position and stops before Scene 6. The background music dips while it plays.

---

## Customising

- **Greeting text in the envelope:** pass a `message` prop to `<Scene6 />` in `App.tsx`.
- **Card designs:** `scenes/Scene7_GreetingCreator/GreetingCard.tsx` (artwork) and `card.css` (colour palettes). The card is sized with container units (`cqw`), so it looks the same in the preview, the envelope and the downloaded image.
- **Fireworks:** shell types, colours and density are in `scenes/Scene5/fireworks.ts` and `Scene5.tsx`.
- **Volumes:** `TARGET_VOLUME` in `BackgroundMusic.tsx`; `MAX_VOLUME` in `FireworksAudio.tsx`.
- **Diya start point and size:** `TEMPLE_SPOT` in `lib/journey.ts`, `START_SIZE` and `END_SIZE` in `Scene1/components/Diya.tsx`.

---

## Accessibility and performance

- Respects `prefers-reduced-motion`: shorter animations, fewer fireworks, no pulsing.
- Pauses 3D and canvas work when off-screen, caps the pixel ratio, and decodes the large images up front so transitions don't stutter.
- The envelope can be opened by keyboard, and the card overlay closes with Esc.
- Best on a recent desktop or mobile browser with WebGL enabled.

---

## Troubleshooting

| Problem | What to check |
| --- | --- |
| No music | Tap, click or press a key once. Check that `public/audio/diwali-music.mp3` exists. |
| No fireworks sound | Check that `public/audio/fireworks.mp3` exists and that sound isn't muted. |
| Google sign-in fails on the live site | Add the domain to Firebase's authorized domains. |
| Saving says "permission denied" | Publish the Firestore rules above. |
| Saving says "offline" | Cards save automatically when the connection returns. |
| Pop-up blocked | Allow pop-ups for the site, then try again. |
| Models or images don't appear | Check the file names and paths under `public/`. |

---

## Credits

Add credits for any third-party models, images, music and sound effects you use, and check that you have the right to use them.

Happy Diwali. 🪔
