---
version: alpha
name: "Béute Pro"
description: "Botanical skincare storefront and its practical catalog administration tools."
colors:
  primary: "#0F2A1D"
  accent: "#C9A44C"
  background: "#F7F4EC"
  surface: "#FFFFFF"
  border: "#E2DBC9"
  text: "#132018"
  muted: "#5C7A68"
  danger: "#A8443C"
  danger-soft: "#F7E7E4"
  success: "#2C6045"
  success-soft: "#E1EDE5"
typography:
  sans:
    fontFamily: 'Manrope, "Helvetica Neue", Arial, sans-serif'
  arabic:
    fontFamily: "Cairo, sans-serif"
rounded:
  DEFAULT: "8px"
  lg: "18px"
omitted:
  - section: spacing
    reason: "Existing responsive runtime tokens remain authoritative; no new spacing scale is introduced."
components:
  button:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.primary}"
  confirmation:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
  media-manager:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
  divider:
    backgroundColor: "{colors.border}"
  hint:
    textColor: "{colors.muted}"
  error:
    textColor: "{colors.danger}"
    backgroundColor: "{colors.danger-soft}"
  success:
    textColor: "{colors.success}"
    backgroundColor: "{colors.success-soft}"
---

# Béute Pro design context

## Overview

The established visual reference is a botanical workshop: dark green labels,
ivory paper and restrained gold accents. The storefront expresses the brand;
admin screens prioritize clear catalog work over decorative treatments.
Pakistan is the evidenced market (PKR prices, delivery copy and manufacturer
addresses). The app supports English and Arabic through `I18nService` and the
central translation dictionary. No Japan-market or Japanese locale is present.

This document records existing design evidence while adding the standalone
product media manager. It does not redesign existing screens or certify their
accessibility. The media API and phase decisions are recorded in the repository's
media checkpoint reports and the current user-approved component contract.

## Colors

Runtime ownership stays in `src/styles.scss :root`. The values above mirror:
`primary → --green`, `accent → --gold`, `background → --ivory`,
`surface → --white`, `border → --ivory-3`, `text → --ink`,
`muted → --green-soft`, `danger → --danger`, `danger-soft → --danger-soft`,
`success → --ok`, `success-soft → --ok-soft`. Components consume these CSS
variables. This file does not generate CSS or introduce another theme adapter.
Gold identifies safe primary actions; danger red identifies deletion/errors.
Text and explicit labels carry meaning alongside color.

## Typography

`sans` mirrors `--sans`; `arabic` mirrors `--sans-ar`. Existing global styles
own locale font selection. Admin headings use the established sans family,
bold weights and compact hierarchy. Long filenames wrap instead of truncating
the only identifier; `<bdi>` isolates filenames within Arabic layouts.

## Layout

Existing shared geometry remains authoritative: `--r: 8px`, `--r-lg: 18px`,
`--max: 1340px`, responsive `--gut` and `--section` in `src/styles.scss`.
Media lives in a normal-height white section. Image previews reserve a 4:3
frame; video reserves 8:5 with contain sizing. At narrow widths images use two
columns and upload actions fill the section width. No parent form/table scroll
ownership is changed. Feedback, media and buttons reserve stable space.

## Elevation & Depth

Section borders and tonal image stages define hierarchy. The media manager adds
no new shadow scale. Existing app-owned confirmation overlays remain the modal
owner; they use the global `.adm-modal` styles.

## Shapes

Controls/cards use `rounded.DEFAULT → --r`; the enclosing section uses
`rounded.lg → --r-lg`. Focus indicators remain visible beyond control edges.

## Components

- **Buttons:** native buttons for actions, visible labels, existing `.btn`
  brand/outline variants, explicit disabled/busy states and 44px important targets.
- **Confirmation:** reuse `admin/ui/confirm-dialog/ConfirmDialog`, conditional
  creation, safe initial focus, existing scroll lock/Escape, plus CDK focus
  trapping/restoration for this consumer. Delete/replacement waits for the server.
- **Feedback:** inline errors remain visible; the existing `ToastService` and
  a polite live region acknowledge success. Loading and upload progress are
  indeterminate because the approved upload service returns completion values.
- **Admin read failures:** `admin/ui/load-error/LoadErrorComponent` owns the shared
  localized failure title, optional error detail, alert semantics and explicit
  retry button. Screen `loadError` signals distinguish failed reads from successful
  empty responses. Unknown counts use a dash; Settings inputs/Save and provider
  rate refresh stay locked until a successful read restores the saved baseline.
- **Media manager:** `UploadService` owns requests. Native file pickers are the
  keyboard alternative to drag/drop. Validate type/count/size before upload,
  keep valid queued files after failures, serialize mutations, and refetch after
  uncertain outcomes before permitting another change. File previews are public
  URLs; no credential or implementation identifier belongs in product copy.
- **Locale:** visible and accessible copy uses `core/data/i18n.data.ts` and
  `I18nService`. Logical CSS properties preserve layout direction.
- **Motion:** short state transitions only; respect reduced motion. Video is
  user-controlled and never autoplays in administration.

## Do's and Don'ts

- Reuse global colors and shared feedback/confirmation owners.
- Preserve static storefront media as the fallback when uploaded media is empty.
- Keep product media management separate from legacy numeric image-count fields.
- Do not show invented upload percentages or automatically retry an uncertain POST.
- The product form renders the media manager for saved product IDs only, between
  basic information and EN/AR copy. New products show localized save-first guidance.
  Create/save keeps the established return-to-list flow. Product saves omit legacy
  image-count/base-URL fields and do not manage uploaded media.
