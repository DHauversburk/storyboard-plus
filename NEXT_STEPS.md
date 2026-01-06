# StoryBoard Plus: Next Steps & Best Practices

## 1. High-Priority Roadmap Items
These features are critical for completing the core "Pro User" experience.

### 📝 Lossless Word (.docx) Import
**Status:** Planned
**Why:** Most serious authors still use MS Word or Scrivener. Migration is painful.
**Implementation:**
-   Use `mammoth.js` or `officeparser` to convert binary `.docx` to HTML/Markdown.
-   **Best Practice:** Sanitize all imported styles to match StoryBoard's "Semantic HTML" structure (h1, h2, p, strong, em) so formatting doesn't break the theme.

### 🔄 Conflict Resolution (Concurrency)
**Status:** Missing
**Why:** If you edit on a tablet and then a laptop, "Last Save Wins" could overwrite hours of work.
**Implementation:**
-   **Timestamp Checking:** Before saving, check if the server's `modifiedTime` > local `lastSyncTime`.
-   **Resolution UI:** If a conflict exists, show a "Diff View" allowing the user to choose "Mine" or "Theirs" (or Keep Both).

## 2. Engineering Best Practices
Recommendations to ensure the app is robust, fast, and maintainable.

### ⚡ Performance: Virtualization & Web Workers
**Issue:** Loading a 120,000-word manuscript into a single `contentEditable` div will freeze the browser.
**Solution:**
-   **Chapter Mode:** Only load the *active* chapter/scene into the DOM.
-   **Web Workers:** Run the heavy "Deep Analysis" (adverbs, styling, stats) on a background thread so typing never lags.

### 🛡️ Data Safety: "Local Snapshots"
**Issue:** Users will inevitably delete something by accident. Cloud undo is limited.
**Solution:**
-   Use `IndexedDB` to keep the last ~50 "AutoSave" states locally.
-   Provide a "Version History" slider in the settings to restore text from 10 minutes ago, even if offline.

### ♿ Accessibility (A11y)
**Issue:** Custom UI components (like our new dropdowns) often trap keyboard focus or miss screen reader tags.
**Solution:**
-   **Focus Guards:** Ensure `Tab` cycles strictly through the modal when open.
-   **ARIA Labels:** Ensure every icon-only button (Save, Dictate) has `aria-label="Save to Drive"`.

## 3. UI/UX Refinement
Polishing the visual experience.

-   **Empty States:** Create friendly "No Data" visuals for the Plotlines, Character, and World Bibles (similar to the new Google Drive login prompt).
-   **Onboarding Tour:** A simple overlay highlighting the 3 key areas: "Explorer (Left)", "Editor (Center)", "Tools (Right)".

## Recommended Action Plan
1.  **Immediate:** Implement `.docx` Import (High impact, low risk).
2.  **Next:** Implement Conflict Safeguards (Critical for data safety).
3.  **Later:** Performance optimization (Web Workers) when documents get large.
