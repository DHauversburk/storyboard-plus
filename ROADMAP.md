# StoryBoard Plus Development Roadmap

This roadmap outlines the planned features and improvements for StoryBoard Plus, divided into key phases of the writing process.

## 1. Drafting & Organization
*Features to help generate text, stay focused, and organize complex projects.*

- [x] **Distraction-Free Mode**: Toggle to hide toolbars/menus, leaving only text (optional "Focus Mode" for current paragraph).
- [x] **Drag-and-Drop Structure**: Card-based scene management for rearranging manuscripts easily (Implemented Manuscript Board).
- [x] **Plot Gridding/Storyboarding**: Visual tools for tracking subplots, arcs, and timelines (Added Kanban Board).
- [x] **Timeline View**: Visual timeline showing story events, character arcs, and world history in parallel (Implemented Master Parallel Timeline).
- [x] **Research Binders**: Project-specific storage for images, PDFs, links, and character notes.
- [x] **Goal Tracking**: Automated session targets (word count, time) with visual progress bars.
- [x] **Dictation**: Integrated speech-to-text for voice drafting (Implemented active voice-to-text with cursor insertion).
- [x] **Dark Mode & Custom Themes**: Full customization of editor colors and fonts (Added Font Face/Size controls).
- [x] **Typewriter Scrolling**: Keeps current line vertically centered.
- [x] **Offline/Cloud Hybrid**: Offline capability with automatic reconnection syncing (Implemented Supabase + Dexie).
- [x] **Enterprise Splash Screen**: Secure loading transition with system checks.

## 2. Grammar & Mechanics (Proofreading)
*Features focused on technical correctness.*

- [x] **Advanced Grammar & Spell Check**: Context-aware checking (e.g., their/there) (Implemented Rule-Based Checker).
- [x] **Punctuation Verification**: Checks for missing commas, dialogue punctuation, run-ons, double spaces.
- [ ] **Plagiarism Detection**: Web/academic scanning for originality.
- [x] **Consistency Checks**: Global scan for spelling variations (US/UK) and hyphenation consistency.

## 3. Style & Line Editing
*Features to improve flow and readability.*

- [x] **Sentence Length Analysis**: Graphs to highlight monotonous sentence structures (Added Visual Flow Chart).
- [x] **Passive Voice Detection**: Highlights passive construction.
- [x] **Adverb & Adjective Monitoring**: Flags overuse of modifiers.
- [x] **Repetition/Echo Catcher**: Identifies proximity of identical words/phrases.
- [x] **"Sticky Sentence" Analysis**: Identifies high-glue-word sentences that slow reading.
- [x] **Cliché Finder**: Highlights overused metaphors and idioms.
- [x] **Thesaurus/Word Explorer**: Contextual synonym suggestions for overused words.
- [x] **Sensory Check**: Analyzes sensory word usage (sight, sound, smell, taste, touch).

## 4. Structural & Developmental Analysis
*Features viewing the story as a whole.*

- [x] **Genre Benchmarking**: Comparison of metrics against genre bestsellers (Added Genre Analysis Widget).
- [x] **Pacing Graphs**: Visualization of narrative speed based on word/scene density.
- [x] **Story Arc Visualization**: Mapping chapters against structures (Hero's Journey, etc.) (Implemented Sentiment Arc).
- [x] **Point of View (POV) Check**: Scans for head-hopping or perspective shifts.
- [x] **Dialogue vs. Narrative Ratio**: Analyzes balance of spoken vs. descriptive text.

## 5. Formatting & Publishing
*Features for creating finished products.*

- [x] **Multi-Format Export**: One-click generation for DOCX, Markdown, HTML, and Plain Text.
- [x] **Device Preview**: Simulation of text on e-readers (Kindle, iPad, etc.) (Implemented in Editor).
- [x] **Custom Chapter Headers**: Ornamental breaks, fonts, and images for headers (Styles added to Export).
- [x] **Widow/Orphan Control**: Automated layout protection (Enabled in DOCX export).
- [x] **Front/Back Matter Generation**: Automated Title Page, TOC, Copyright, and Dedication (Implemented in DOCX export).
- [x] **Print Settings**: Trim sizes, margins, headers/footers control.

## 6. Workflow & Integration
*External connections and collaboration.*

- [x] **Google Drive Integration**: Cloud storage for projects.
- [x] **Smart Import**: Rich text import from Google Docs (HTML formatting).
- [ ] **Export/Import Flexibility**: Lossless import from Word (.docx direct).
- [ ] **Collaboration Tools**: Comments, track changes, and co-authoring features.

## 7. Core Storytelling Tools
*Essential features for story planning and worldbuilding.*

- [x] **Character Manager**: Full CRUD for characters with roles (protagonist/antagonist/supporting/minor), archetypes, traits, goals, flaws, and relationships.
- [x] **Plotline Tracker**: Manage main plots, subplots, character arcs, mysteries, and romance arcs with progress tracking and plot beats.
- [x] **World Bible**: Comprehensive worldbuilding database with categories (locations, cultures, magic, technology, history, creatures, organizations, items).
- [x] **Timeline View**: Visual timeline showing story events, character arcs, and world history in parallel.
- [x] **Relationship Web**: Visual map of character relationships (Implemented Interactive Force-Directed Graph).
- [x] **Codex Auto-Detection Improvement**: Expand categories and refine keywords to correctly classify entities (e.g., separating VR/Tech from Logic/Magic).

## 8. Platform Support & Optimization
*Ensuring the best experience across all devices.*

- [x] **Mobile Responsive UI**: Collapsible sidebars, touch-optimized controls, and stacked layouts for phone portrait mode.
- [x] **Tablet Optimization**: Split-pane layouts and stylus support for iPad/Android tablets.
- [x] **Device Auto-Detection**: Automatically detect screen size and adapt the workspace (e.g., hiding non-essential panels on small screens).
