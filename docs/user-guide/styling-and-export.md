# Subtitle Styling, Animations, and Video Export

This guide covers typography customization, style presets, kinetic karaoke animations, subtitle exports (SRT, VTT, ASS), and burned-in video rendering.

---

## 1. Style Studio and Typography

Open the **Style Studio** tab in the right sidebar to customize the visual appearance of your subtitles:

* **Typography**: Choose font family (Inter, Outfit, Roboto, Montserrat, Poppins), font size, weight, letter spacing, and line height.
* **Colors**: Customize primary fill color, outline stroke width and color, and drop shadow blur/distance.
* **Box Model & Background**: Toggle background pill/box containers with custom opacity, border radius, and padding.
* **Positioning**: Align subtitles to bottom, center, or top, and adjust vertical margin percentage.

---

## 2. Professional Style Presets

Select from built-in curated presets or save your own:

* **Clean Standard**: Subtle white text with soft dark outline, ideal for tutorials and lectures.
* **Minimal Modern**: Clean sans-serif typography with no heavy borders.
* **Podcast Heavy**: Semi-transparent dark background card with crisp bold text.
* **Karaoke Kinetic**: Vibrant yellow active word highlight with synchronized scale animation.
* **Punch Pop**: High-contrast, bold uppercase styling popular on short-form video feeds.
* **Neon Glow**: Cyberpunk aesthetic with soft cyan glow and dark shadow.
* **Cinematic Elegance**: Traditional serif styling with gentle letter spacing.

### Creating and Exporting Custom Presets
1. Adjust style parameters in the Style Studio panel.
2. Click **Save as New Preset** and name your preset.
3. To share styles with teammates, click **Export Preset** to generate a `.vstyle.json` file.
4. Use **Import Preset** to load `.vstyle.json` files on any workstation.

---

## 3. Kinetic Typography and Karaoke Motion

Vaani Studio features millisecond-accurate word-level timing:

* **Active Word Highlighting**: While playing, the current spoken word highlights in the designated accent color.
* **Entrance Animations**:
  * **None**: Instant appearance.
  * **Fade**: Smooth opacity transition.
  * **Pop**: Subtle scale bounce from 90% to 100%.
  * **Slide Up**: Upward movement into final position.
  * **Bounce**: Energetic spring motion for punchy captions.
* **Real-Time Preview**: The canvas preview player renders all CSS and Canvas animation effects in real time at 60 FPS.

---

## 4. Exporting Subtitles and Burned-In Video

Click the **Export** button in the header toolbar to open the Export Modal:

### Subtitle File Formats
* **SubRip (.srt)**: Industry-standard plain text subtitles compatible with YouTube, Premiere Pro, DaVinci Resolve, and Final Cut Pro.
* **WebVTT (.vtt)**: HTML5 web-compatible captions supporting formatting cues.
* **Advanced SubStation Alpha (.ass)**: Preserves all typography, colors, positions, and karaoke animation tags (`\k`).

### Burned-In Video Export (Hardcoding)
To export a ready-to-publish video with permanent burned-in captions:

1. Select **Video Burn-in (Hardcoded MP4)** in the Export Modal.
2. Choose your target **Resolution**:
   * Original Source Resolution
   * 1080p Full HD (1920x1080 or 1080x1920)
   * 720p HD (1280x720 or 720x1280)
3. Select your **Encoding Preset** and hardware acceleration preference (Auto, NVENC, QuickSync, or CPU libx264).
4. Click **Start Video Rendering**.
5. Track rendering progress, elapsed time, and ETA. Once completed, click **Show in Folder** to access the final MP4.
