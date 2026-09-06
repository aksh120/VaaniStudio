# Transcription and Subtitle Editing

This guide covers speech-to-text generation, code-switching controls, timeline operations, and transactional editing.

---

## 1. Running Speech Recognition

Once media is imported:

1. Open the **Speech & ASR** tab in the right sidebar.
2. Select your target **Language Mode**:
   * **Auto-Detect**: Detects the predominant language and transitions dynamically.
   * **English**: Restricts transcription to English vocabulary.
   * **Hindi**: Transcribes speech into Devanagari Hindi.
   * **Hinglish**: Optimized for conversational code-switched Indian English and colloquial Hindi loanwords.
3. Select your **Script Mode**:
   * **Native**: English in Latin script, Hindi in Devanagari.
   * **Latin (Romanized)**: Transliterates all speech into Roman script (e.g., *Namaste dosto*).
   * **Devanagari**: Transliterates English loanwords into phonetic Devanagari (e.g., *कंप्यूटर*).
4. Click **Start Local ASR Transcription**.
5. The inference engine processes audio using Voice Activity Detection (VAD) to filter silence, streams intermediate progress, and populates the subtitle list and timeline.

---

## 2. Interactive Editing in the Subtitle List

The left panel displays a virtualized list of all subtitle segments with start time, end time, duration, and text:

* **Text Editing**: Click on any subtitle text to edit directly. Edits are recorded immediately in the undo history.
* **Timing Adjustment**: Click start or end timecodes to adjust timestamps down to the millisecond.
* **Selection & Scrub**: Clicking any subtitle event moves the video playhead and timeline to that segment start time.
* **Reading Speed Validation**: If a subtitle exceeds standard broadcast reading speed (CPS > 21) or line length (CPL > 42), warning badges appear to help you split or rephrase.

---

## 3. Waveform Timeline Navigation

The bottom timeline visualizes the extracted audio waveform and subtitle event blocks:

* **Playhead Scrubbing**: Click or drag anywhere in the timeline ruler to scrub through audio.
* **Boundary Adjustment**: Drag the left or right edges of any subtitle block to stretch or contract start/end points.
* **Zooming**: Use the zoom slider or `Ctrl + Mouse Wheel` to expand waveform resolution from 10 seconds to full file overview.

---

## 4. Subtitle Operations and Keyboard Shortcuts

| Action | Shortcut | Description |
| :--- | :--- | :--- |
| Play / Pause | `Space` | Toggles media playback |
| Split Subtitle | `S` or `Ctrl+K` | Splits active subtitle at playhead position |
| Merge with Next | `M` | Merges selected subtitle with the adjacent next segment |
| Insert Subtitle | `I` | Inserts a 2-second subtitle event at playhead |
| Duplicate Subtitle | `D` | Creates a copy of the selected subtitle directly after it |
| Delete Subtitle | `Delete` or `Backspace` | Removes the selected subtitle event |
| Undo Last Edit | `Ctrl+Z` | Reverts the last operation (up to 100 states) |
| Redo Edit | `Ctrl+Y` or `Ctrl+Shift+Z` | Reapplies reverted operation |
| Step 1 Frame | `Left` / `Right` | Nudges playhead by 1/30th of a second |
| Step 1 Second | `Shift+Left` / `Shift+Right` | Nudges playhead by 1 second |
