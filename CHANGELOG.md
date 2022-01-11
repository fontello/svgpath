# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [2.5.0] - 2022-01-11
### Changed
- Refactored `.toString()` to improve speed.


## [2.4.1] - 2022-01-03
### Fixed
- Fixed TS definition (regression in 2.4.0), #57.


## [2.4.0] - 2021-12-21
### Changed
- Updated TS definition, #56, #55.


## [2.3.1] - 2021-02-17
### Changed
- Updated TS definition.


## [2.3.0] - 2020-05-31
### Added
- Added `SvgPath.from()` method.


### Changed
- Dev deps bump.
- Use `nyc` for coverage reports.


## [2.2.3] - 2020-01-19
### Fixed
- Fix arc flags parse (accept 0 or 1 only), #41.
- Typo fix in error message.


## [2.2.2] - 2019-04-27
### Changed
- Dev deps bump.
- Fix typescript definitions, #32.


## [2.2.1] - 2016-12-24
### Changed
- Update typescript definition for ts@2, #28.
- Replace unicode characters with ascii ones, #27.


## [2.2.0] - 2016-09-11
### Added
- Added `.skewX()` & `.skewY()` shortcuts.
- Added typescript definitions.

### Changed
- Dropped `Makefile`, use npm instead.
- Deps bump & cleanup.


## [2.1.6] - 2016-03-09
### Fixed
- Fixed arc transforms for edge cases (precision + sweep flag), #23.


## [2.1.5] - 2016-01-03
### Changed
- Improved parser error messages.


## [2.1.4] - 2016-01-03
### Fixed
- More strict params count and exponent parse.
- Properly correct round error on contour end.
- Never drop empty arcs. Replace with lines to avoid collisions on `S A S`.


## [2.1.3] - 2015-12-30
### Fixed
- Fixed `.unarc()` - expand zero-radius arcs to lines.


## [2.1.2] - 2015-12-22
### Fixed
- Fixed arc transforms, #13. Thanks to @kpym.


## [2.1.1] - 2015-12-07
### Fixed
- Don't collapse `M` & `m` commands on output.


## [2.1.0] - 2015-10-27
### Fixed
- First `m` in path should be processed as absolute (`M`).
- Don't force first `M` -> `m` on `.rel()`.


## [2.0.0] - 2015-04-16
### Changed
- Unified transformations math.
- Evaluate curried transforms lazily.
- 100% tests coverage.
- Minor optimisations & code refactoring.

### Added
- Added `.matrix` and `.rotate()`.
- Added `.unarc()` - convert arcs to curves.

### Fixed
- Fixed `.unshort()` - now relative commands processed too.
- Fixed `.round()` - no more precision loss on relative coordinated.


## [1.0.7] - 2014-12-05
### Changed
- Parser rewrite (1.5x speedup).
- Exposed `.err` property with text of error (empty on success).


## [1.0.6] - 2014-06-15
### Changed
- Maintenance release - docs & build scripts update.


## [1.0.5] - 2014-04-09
### Added
- Fixed line terminators handle in parser.


## [1.0.4] - 2014-03-14
### Added
- Added .transform() support.


## [1.0.3] - 2014-02-23
### Changed
- Parser rewrite (2x speed gain).
- toString(): skip command name on repeaded sequences.
- Added tests & benchmarks.

## [1.0.2] - 2013-12-03
### Fixed
- Fixed arcs roundung (missed type cast), by @kolya-ay.


## [1.0.1] - 2013-10-02
### Fixed
- Fixed params parse: 29.5.5 -> 29.5, 0.5.


## [1.0.0] - 2013-09-26
### Changed
- First release.


[2.5.0]: https://github.com/fontello/svgpath/compare/2.4.1...2.5.0
[2.4.1]: https://github.com/fontello/svgpath/compare/2.4.0...2.4.1
[2.4.0]: https://github.com/fontello/svgpath/compare/2.3.1...2.4.0
[2.3.1]: https://github.com/fontello/svgpath/compare/2.3.0...2.3.1
[2.3.0]: https://github.com/fontello/svgpath/compare/2.2.3...2.3.0
[2.2.3]: https://github.com/fontello/svgpath/compare/2.2.2...2.2.3
[2.2.2]: https://github.com/fontello/svgpath/compare/2.2.1...2.2.2
[2.2.1]: https://github.com/fontello/svgpath/compare/2.2.0...2.2.1
[2.2.0]: https://github.com/fontello/svgpath/compare/2.1.6...2.2.0
[2.1.6]: https://github.com/fontello/svgpath/compare/2.1.5...2.1.6
[2.1.5]: https://github.com/fontello/svgpath/compare/2.1.4...2.1.5
[2.1.4]: https://github.com/fontello/svgpath/compare/2.1.3...2.1.4
[2.1.3]: https://github.com/fontello/svgpath/compare/2.1.2...2.1.3
[2.1.2]: https://github.com/fontello/svgpath/compare/2.1.1...2.1.2
[2.1.1]: https://github.com/fontello/svgpath/compare/2.1.0...2.1.1
[2.1.0]: https://github.com/fontello/svgpath/compare/2.0.0...2.1.0
[2.0.0]: https://github.com/fontello/svgpath/compare/1.0.7...2.0.0
[1.0.7]: https://github.com/fontello/svgpath/compare/1.0.6...1.0.7
[1.0.6]: https://github.com/fontello/svgpath/compare/1.0.5...1.0.6
[1.0.5]: https://github.com/fontello/svgpath/compare/1.0.4...1.0.5
[1.0.4]: https://github.com/fontello/svgpath/compare/1.0.3...1.0.4
[1.0.3]: https://github.com/fontello/svgpath/compare/1.0.2...1.0.3
[1.0.2]: https://github.com/fontello/svgpath/compare/1.0.1...1.0.2
[1.0.1]: https://github.com/fontello/svgpath/compare/1.0.0...1.0.1
[1.0.0]: https://github.com/fontello/svgpath/releases/tag/1.0.0
