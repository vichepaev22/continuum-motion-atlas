# Editorial quality audit — 2026-11-27

Scope: source inspection of index.html, v2.js, analytics configuration, package.json, model access registry and existing analytics tests. Live URL fetch was unavailable in this session. No claims of a new-model performance gain or WCAG conformance.

| Priority | Finding / evidence | Action / acceptance |
|---|---|---|
| P1 | Lab loaded any JSON array and dereferenced answer.slice on each record; malformed data could interrupt initialization. | Validate records and integer ratings; preserve valid records. Regression test seeds mixed records, expects one retained and seven training tabs. |
| P1 | Lab clearing reported success even if local persistence failed. | Report persistence failure accurately. |
| P1 | Playwright exists but no axe dependency in inspected package.json. | Add automated accessibility scan plus manual keyboard, focus, contrast, 320px reflow and screen reader checks. Not yet executed. |
| P1 | Primary cover uses Wikimedia URL, photo uses Pexels URL, fonts use Google CDN. | Review rights; localize licensed assets and verify offline/third-party failure. Not yet executed. |
| P2 | og:image references an external museum photo rather than a dedicated editorial share card. | Produce licensed original social card and validate previews. Preserve existing cover concept. |
| P2 | Page has inline CSS, inline JS and multiple extensions; source length ~136 KB. | Measure actual transfer, LCP, INP, CLS before optimizing; source length alone is not evidence of slow load. |
| P2 | Model access registry dated 21 Nov, no fresh browser verification here. | Recheck direct chat and version, weights and licenses separately, update dates. |
| P2 | Analytics configured off; existing tests use mock provider. | Do not activate without configured provider and appropriate privacy review. |
| P2 | Reading comprehension not measured in available evidence. | Run representative reader tasks and document findings. |

References: WCAG 2.2 https://www.w3.org/TR/WCAG22/ ; Playwright accessibility testing https://playwright.dev/docs/accessibility-testing ; Core Web Vitals https://web.dev/articles/vitals .

Preserve baseline design, chapter structure, factual attribution and all working reader features. Review changes in this branch; merge only after CI and deployment checks. The reusable skill is https://github.com/vichepaev22/digital-editorial-studio .
