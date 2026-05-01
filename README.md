# cig-cli 🚬

Stream TV series directly in your terminal. No browser. No ads clicking. Just pick and watch.

```
 cig-cli — stream series in your terminal

[cig] searching for 'breaking bad'...

  1) Breaking Bad (2008)
  2) Breaking Bad: Original Minisodes (2009)

Pick show: 1

  1) Season 1 (7 episodes)
  2) Season 2 (13 episodes)
  ...

Pick season: 1

  1) E01 — Pilot
  2) E02 — Cat's in the Bag...
  ...

Pick episode: 1

[cig] opening player...
[cig] playing: Breaking Bad S01E01 — Pilot
```

---

## How it works

1. You search for a show → **TMDB API** returns results
2. You pick show → season → episode
3. A headless Chromium browser opens the stream provider in the background, clicks play, and intercepts the real video URL (m3u8)
4. **mpv** plays it

No manual browser needed. The whole thing runs in your terminal.

---

## Requirements

| Tool | Install |
|------|---------|
| Python 3 | usually pre-installed |
| Node.js | `pacman -S nodejs` / `brew install node` |
| mpv | `pacman -S mpv` / `brew install mpv` |
| python-requests | `pacman -S python-requests` or `pip install requests` |
| python-beautifulsoup4 | `pacman -S python-beautifulsoup4` or `pip install beautifulsoup4` |
| ffsubsync *(optional)* | `pip install ffsubsync` — auto-syncs subtitles to stream audio |

---

## Installation

**1. Clone the repo**
```bash
git clone https://github.com/Sami111-Afk/cig-cli.git
cd cig-cli
```

**2. Install Node dependencies**
```bash
npm install
npx playwright install chromium
```
> This downloads a headless Chromium (~112MB). Only needed once.

**3. Get a free TMDB API key**

- Go to [themoviedb.org](https://www.themoviedb.org/) and create a free account
- Settings → API → Create → Developer
- Copy your **API Key (v3 auth)**

**4. Set your API key**

Add it to your shell config so it's always available:

```bash
# bash / zsh
echo 'export TMDB_API_KEY="your_key_here"' >> ~/.bashrc

# fish
echo 'set -gx TMDB_API_KEY "your_key_here"' >> ~/.config/fish/config.fish
```

Then reload your shell or open a new terminal.

**5. (Optional) English subtitles**

Many streams already have embedded English subtitles picked up automatically. For guaranteed external subtitles, get a free API key from [subdl.com](https://subdl.com) (free registration, 200 downloads/day) and add it:

```bash
# bash / zsh
echo 'export SUBDL_API_KEY="your_subdl_key"' >> ~/.bashrc

# fish
echo 'set -gx SUBDL_API_KEY "your_subdl_key"' >> ~/.config/fish/config.fish
```

If `SUBDL_API_KEY` is not set, cig-cli still works — it just relies on embedded subtitles from the stream.

**6. Make cig-cli available system-wide**
```bash
sudo ln -sf "$PWD/cig" /usr/local/bin/cig-cli
```

Or add the folder to your PATH:
```bash
fish_add_path /path/to/cig-cli   # fish
export PATH="$PATH:/path/to/cig-cli"  # bash/zsh
```

---

## Usage

```bash
cig-cli "show name"
```

Or launch without arguments to type the search:
```bash
cig-cli
```

**Examples:**
```bash
cig-cli "breaking bad"
cig-cli "the mentalist"
cig-cli "the office"
cig-cli "dark"
```

Use the number keys to pick from each menu.

---

## Why does this sometimes break?

The stream providers (vidsrc.to and similar) occasionally change their page structure or CDN tokens. When that happens, `cig-cli` won't be able to extract the video URL. If you see errors, check if there's a newer version of this repo or open an issue.

This is the same reason tools like `mov-cli` stopped working — it's a cat-and-mouse game with the providers.

---

## Project structure

```
cig-cli/
├── cig          # main Python script — handles search, menus, and mpv
├── extract.js   # Node.js script — uses Playwright to intercept the video URL
├── package.json # Node dependencies (playwright)
└── requirements.txt  # Python dependencies
```

---

## Contributing

Pull requests are welcome. If a provider breaks, the most likely fix is in `extract.js` (the play button selector or the request interceptor) or in `get_player_urls()` inside `cig`.

---

## License

Do whatever you want with it.
