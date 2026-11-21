# Third-party notices

Three OFL fonts ship self-hosted in `public/fonts/`, latin subset, with their
licences beside the files. Sources: the Google Fonts catalogue and the
`google/fonts` repository.

| Family | Role | Licence file |
| --- | --- | --- |
| Libre Bodoni (variable 400–700) | Display | `public/fonts/OFL-Libre-Bodoni.txt` |
| Newsreader (variable 400–700, opsz 6–72) | Text | `public/fonts/OFL-Newsreader.txt` |
| IBM Plex Mono (400, 500, 600) | Data | `public/fonts/OFL-IBM-Plex-Mono.txt` |

Each file is licensed under the SIL Open Font License 1.1; the full text is in
the named file. No font is fetched from a CDN at runtime.

## glsl-black-hole

The event-horizon shader in `src/lib/blackhole/` is ported from
[`sayed1145/glsl-black-hole`](https://github.com/sayed1145/glsl-black-hole),
a pure-GLSL WebGL2 black hole with gravitational lensing and an accretion disc.
The live demo is at <https://sayed1145.github.io/glsl-black-hole/>.

MIT License

Copyright (c) 2026 sayed1145

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

The port keeps the four-pass pipeline, the radiance profiles and the optical
constants. It changes the render targets from a fixed square to a viewport-sized
rectangle so the field can fill the hero, and adds DPR capping, pausing and
context recovery for the application.
