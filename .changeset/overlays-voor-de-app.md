---
"@fromorbit/ui": patch
---

What the Orbit app needs to take `DropdownMenu` and `Toast` from the package instead of keeping a copy:

- `DropdownMenu` (and `ContextMenu`, which shares its rows): Escape in a submenu closes that submenu alone and puts the focus back on the row that opened it, as the menu pattern of the WAI-ARIA APG asks; Escape on the menu itself still closes it. A menu's width cap is now the token `--nt-menu-max-width` (320px, unchanged), and the new prop `width="wide"` switches a `DropdownMenu` to `--nt-menu-max-width-wide` (360px) for a menu of names of the user's own, such as a project picker. Both stop 8px inside the window. `MENU_WIDTH` is internal; a test that compared its class `max-w-[min(20rem,…)]` reads `max-w-[min(var(--nt-menu-max-width),…)]` now.
- `ToastProvider`: the new prop `besideRail` (`'wide' | 'narrow'`) starts the toasts 8px into the plane beside the rail of the shell (`--nt-shell-plane-inset-start`, or its `-narrow` form) instead of 16px from the window's edge. The start is the new token `--nt-toast-inset-start` (16px), which a host may also set itself. Its props have a type of their own, `ToastProviderProps`. The region of the toasts takes its name from the host: `UiProvider` has a new `labels` prop (`UiLabels`), and `labels.toastRegion` names the region when `ToastProvider` gets no `label`.
- `Dialog`: the first control takes the focus with its ring only when the dialog was opened from the keyboard (`focusVisible`), not after a click. The footer wraps its buttons in a narrow window and is a size container (`@container`), so a caller can stack them.
- The register of layers is exported from `.`: `collectOccluders`, `observeLayers` and the type `LayerMeasure`, for a host with a hosted surface of its own.
- `SettingRow`: `labels` is optional and defaults to `labels.settingRow` of the `UiProvider`; a row's own `labels` still win, and a row with words from neither place throws. `SettingFoldRow` holds no words, so it needs none.
