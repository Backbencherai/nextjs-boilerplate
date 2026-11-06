# Adarsh — Portfolio

A single-page portfolio built with Next.js 15. The layout follows a modern personal-portfolio structure (hero → about → featured work → filterable project matrix → contact), skinned with the **SAVO** landing-page look and motion:

- Preloader that fades out on load
- Fixed blue background cover behind the sections, alternating with white sections
- Scroll-reveal on almost everything: *"wait Xs, then enter top/left/right/bottom and move 40px over 1s"* (`data-reveal` + `data-delay`)
- Raised "rocket" buttons (lift + shine on hover), spinning feature-icon circles
- Gallery grid with hover overlays, auto-playing carousel with dots/arrows
- Newsletter-style email form, copy-email toast, social icons
- Respects `prefers-reduced-motion`

## Edit your content

Everything (name, role, bio, projects, gallery, socials, email) lives in **`app/data.ts`**.
To use real images in the gallery/carousel, put files in `public/` and add `src: "/file.jpg"` to the gallery items.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```
