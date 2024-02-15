# 0.7.0 (Thu Feb 15 2024)

### Release Notes

#### `com.intuit.playerui` publishing scope ([#253](https://github.com/player-ui/player/pull/253))

Embracing the `player-ui` namespace, the base group ID, and correlating package scopes, have changed:
`com.intuit.player` -> `com.intuit.playerui`

1. Dropping `.jvm` from non-android artifacts
   - This was originally done to leave room for intermediate JS resource artifacts. This is no longer necessary due to improvements in our build process, and enables us to remove this redundancy.

| Artifact | Internal | External |
| -------- | -------- | -------- |
| Headless Player | `com.intuit.player.jvm:core` | `com.intuit.playerui:core` |
| Android Player | `com.intuit.player.android:player` | `com.intuit.playerui:android` |
| Plugins | `com.intuit.player.plugins`<br/>`com.intuit.player.jvm.plugins`<br/>`com.intuit.player.android.plugins` | `com.intuit.playerui.plugins` |

#### Refactor existing DSL docs. ([#288](https://github.com/player-ui/player/pull/288))

Update DSL docs

#### Remove Applitools ([#277](https://github.com/player-ui/player/pull/277))

Enhance `AsyncViewStub.awaitView()` to ensure any child `AsyncViewStub`s are resolved as well. This really only affects initial hydration, preventing weird isolated rendering jank by ensuring everything is ready to be shown on screen before actually rendering the top-level asset.

<!--
  To include release notes in the automatic changelong, just add a level 1 markdown header below
  and include any markdown notes to go into the changelog: https://intuit.github.io/auto/docs/generated/changelog#additional-release-notes

  Example:

  # Release Notes
  Added new plugin, to use it:
  ```typescript
  const plugin = new Plugin(...)
  ```
-->

---

#### 🚀 Enhancement

- `com.intuit.playerui` publishing scope [#253](https://github.com/player-ui/player/pull/253) ([@sugarmanz](https://github.com/sugarmanz))
- feat: add github.dev links to docs [#278](https://github.com/player-ui/player/pull/278) (rafael_campos@intuit.com [@rafbcampos](https://github.com/rafbcampos))

#### 🐛 Bug Fix

- Release main [#301](https://github.com/player-ui/player/pull/301) ([@intuit-svc](https://github.com/intuit-svc))
- iOS: add asyncnodeplugin resource path to bazel.build zip [#300](https://github.com/player-ui/player/pull/300) (nancy_wu1@intuit.com [@nancywu1](https://github.com/nancywu1))
- fix: missing docs/site on docs links [#299](https://github.com/player-ui/player/pull/299) (rafael_campos@intuit.com [@rafbcampos](https://github.com/rafbcampos))
- fix: help to improve docs links with relative path [#298](https://github.com/player-ui/player/pull/298) (rafael_campos@intuit.com [@rafbcampos](https://github.com/rafbcampos))
- Refactor existing DSL docs. [#288](https://github.com/player-ui/player/pull/288) ([@KetanReddy](https://github.com/KetanReddy))
- AsyncNodePlugin- use named export, port iOS plugin [#295](https://github.com/player-ui/player/pull/295) (nancy_wu1@intuit.com [@nancywu1](https://github.com/nancywu1))
- Fix broken link in CONTRIBUTING.md [#291](https://github.com/player-ui/player/pull/291) ([@KetanReddy](https://github.com/KetanReddy))
- Remove Applitools [#277](https://github.com/player-ui/player/pull/277) ([@sugarmanz](https://github.com/sugarmanz) [@hborawski](https://github.com/hborawski))

#### 📝 Documentation

- [Docs] plugin and cli updates, links fix [#294](https://github.com/player-ui/player/pull/294) (alejandro_fimbres@intuit.com [@lexfm](https://github.com/lexfm))
- AssetProviderPlugin - Docs update [#283](https://github.com/player-ui/player/pull/283) (marlon_ercillo@intuit.com [@mercillo](https://github.com/mercillo))
- Plugins android clean up [#290](https://github.com/player-ui/player/pull/290) (sentony03@gmail.com nancy_wu1@intuit.com [@brocollie08](https://github.com/brocollie08))
- docDays/updated FAQS [#282](https://github.com/player-ui/player/pull/282) (marlon_ercillo@intuit.com [@mercillo](https://github.com/mercillo))
- iOS: Update plugin documentation [#284](https://github.com/player-ui/player/pull/284) ([@hborawski](https://github.com/hborawski) nancy_wu1@intuit.com)
- Update Team Page with New Members [#280](https://github.com/player-ui/player/pull/280) ([@KetanReddy](https://github.com/KetanReddy))
- iOS: Update Writing Plugins guide [#279](https://github.com/player-ui/player/pull/279) ([@hborawski](https://github.com/hborawski))
- [JVM] pom with minimal oss requirements [#275](https://github.com/player-ui/player/pull/275) ([@sugarmanz](https://github.com/sugarmanz))
- Fix SwiftUIPendingTransactionPlugin Docs Page [#276](https://github.com/player-ui/player/pull/276) ([@KetanReddy](https://github.com/KetanReddy))

#### Authors: 14

- [@brocollie08](https://github.com/brocollie08)
- [@intuit-svc](https://github.com/intuit-svc)
- [@nancywu1](https://github.com/nancywu1)
- afimbres (alejandro_fimbres@intuit.com)
- Alex Fimbres ([@lexfm](https://github.com/lexfm))
- brocollie08 (sentony03@gmail.com)
- Harris Borawski ([@hborawski](https://github.com/hborawski))
- Jeremiah Zucker ([@sugarmanz](https://github.com/sugarmanz))
- Ketan Reddy ([@KetanReddy](https://github.com/KetanReddy))
- Marlon "Marky" Ercillo ([@mercillo](https://github.com/mercillo))
- mercillo (marlon_ercillo@intuit.com)
- nancywu1 (nancy_wu1@intuit.com)
- Rafael Campos ([@rafbcampos](https://github.com/rafbcampos))
- rcampos2 (rafael_campos@intuit.com)

---

# 0.6.0 (Thu Jan 25 2024)

#### 🚀 Enhancement

- Latest sync including AsyncNodePlugin [#263](https://github.com/player-ui/player/pull/263) (sentony03@gmail.com [@nancywu1](https://github.com/nancywu1) [@brocollie08](https://github.com/brocollie08))

#### 🐛 Bug Fix

- Release main [#274](https://github.com/player-ui/player/pull/274) ([@intuit-svc](https://github.com/intuit-svc))
- Playa 8756 - iOS add callTryCatchWrapper function on JSValue [#270](https://github.com/player-ui/player/pull/270) (nancy_wu1@intuit.com [@nancywu1](https://github.com/nancywu1))
- Release main [#273](https://github.com/player-ui/player/pull/273) ([@intuit-svc](https://github.com/intuit-svc))
- Fix `com.intuit.player:j2v8` transitive deps [#256](https://github.com/player-ui/player/pull/256) ([@sugarmanz](https://github.com/sugarmanz))
- update iOS StageRevertDataPluginTests [#264](https://github.com/player-ui/player/pull/264) (nancy_wu1@intuit.com [@nancywu1](https://github.com/nancywu1))

#### 📝 Documentation

- DSL documentation changes [#266](https://github.com/player-ui/player/pull/266) (rafael_campos@intuit.com [@rafbcampos](https://github.com/rafbcampos))

#### Authors: 9

- [@brocollie08](https://github.com/brocollie08)
- [@intuit-svc](https://github.com/intuit-svc)
- [@nancywu1](https://github.com/nancywu1)
- brocollie08 (sentony03@gmail.com)
- Jeremiah Zucker ([@sugarmanz](https://github.com/sugarmanz))
- nancywu1 (nancy_wu1@intuit.com)
- Rafael Campos ([@rafbcampos](https://github.com/rafbcampos))
- rcampos2 (rafael_campos@intuit.com)
- zwu01 (nancy_wu1@intuit.com)

---

# 0.5.1 (Thu Dec 07 2023)

#### 🐛 Bug Fix

- Release main [#259](https://github.com/player-ui/player/pull/259) ([@intuit-svc](https://github.com/intuit-svc))
- iOS - allow navigationFlowViewState attributes to take Any instead of string [#258](https://github.com/player-ui/player/pull/258) ([@zwu011](https://github.com/zwu011) [@nancywu1](https://github.com/nancywu1))

#### Authors: 3

- [@intuit-svc](https://github.com/intuit-svc)
- [@nancywu1](https://github.com/nancywu1)
- [@zwu011](https://github.com/zwu011)

---

# 0.5.0 (Tue Dec 05 2023)

### Release Notes

#### Sync Android and JVM packages to latest ([#222](https://github.com/player-ui/player/pull/222))



---

#### 🚀 Enhancement

- Sync Android and JVM packages to latest [#222](https://github.com/player-ui/player/pull/222) ([@Kiwiegg](https://github.com/Kiwiegg) [@sugarmanz](https://github.com/sugarmanz))

#### 🐛 Bug Fix

- Release main [#254](https://github.com/player-ui/player/pull/254) ([@intuit-svc](https://github.com/intuit-svc))

#### Authors: 3

- [@intuit-svc](https://github.com/intuit-svc)
- Jeremiah Zucker ([@sugarmanz](https://github.com/sugarmanz))
- Larry ([@Kiwiegg](https://github.com/Kiwiegg))

---

# 0.4.5 (Mon Nov 27 2023)

#### 🐛 Bug Fix

- Release main [#251](https://github.com/player-ui/player/pull/251) ([@intuit-svc](https://github.com/intuit-svc))
- 177/ add plugin examples and managed player to demo app [#215](https://github.com/player-ui/player/pull/215) ([@zwu011](https://github.com/zwu011) [@nancywu1](https://github.com/nancywu1))
- iOS: add SwiftUIPendingTransactionPlugin to reference asset dependencies [#250](https://github.com/player-ui/player/pull/250) ([@hborawski](https://github.com/hborawski))
- Mocks for plugins [#206](https://github.com/player-ui/player/pull/206) (marlon_ercillo@intuit.com [@mercillo](https://github.com/mercillo) [@zwu011](https://github.com/zwu011) [@hborawski](https://github.com/hborawski) [@brocollie08](https://github.com/brocollie08) [@adierkens](https://github.com/adierkens) [@intuit-svc](https://github.com/intuit-svc))
- store cancellables in ManagedPlayerViewModelTests [#210](https://github.com/player-ui/player/pull/210) ([@hborawski](https://github.com/hborawski))
- apply swift 6 warning fix to flaky iOS tests [#207](https://github.com/player-ui/player/pull/207) ([@hborawski](https://github.com/hborawski))
- iOS: make AssetBeacon equatable and add public init for metadata [#248](https://github.com/player-ui/player/pull/248) ([@hborawski](https://github.com/hborawski))
- Singular workflow for CI [#214](https://github.com/player-ui/player/pull/214) (sentony03@gmail.com [@brocollie08](https://github.com/brocollie08))
- update Gemfile.lock [#208](https://github.com/player-ui/player/pull/208) ([@hborawski](https://github.com/hborawski))

#### 🏠 Internal

- Update ruby version in build [#246](https://github.com/player-ui/player/pull/246) ([@adierkens](https://github.com/adierkens))

#### Authors: 9

- [@brocollie08](https://github.com/brocollie08)
- [@intuit-svc](https://github.com/intuit-svc)
- [@nancywu1](https://github.com/nancywu1)
- [@zwu011](https://github.com/zwu011)
- Adam Dierkens ([@adierkens](https://github.com/adierkens))
- brocollie08 (sentony03@gmail.com)
- Harris Borawski ([@hborawski](https://github.com/hborawski))
- Marlon "Marky" Ercillo ([@mercillo](https://github.com/mercillo))
- mercillo (marlon_ercillo@intuit.com)

---

# 0.4.4 (Mon Nov 20 2023)

#### 🐛 Bug Fix

- Release main [#249](https://github.com/player-ui/player/pull/249) ([@intuit-svc](https://github.com/intuit-svc))
- iOS: make AssetBeacon equatable and add public init for metadata [#248](https://github.com/player-ui/player/pull/248) ([@hborawski](https://github.com/hborawski))

#### 🏠 Internal

- Update ruby version in build [#246](https://github.com/player-ui/player/pull/246) ([@adierkens](https://github.com/adierkens))

#### Authors: 3

- [@intuit-svc](https://github.com/intuit-svc)
- Adam Dierkens ([@adierkens](https://github.com/adierkens))
- Harris Borawski ([@hborawski](https://github.com/hborawski))

---

# 0.4.3 (Fri Nov 17 2023)

### Release Notes

#### Add Automation ID to Error Element in Storybook ([#245](https://github.com/player-ui/player/pull/245))

Storybook error element has a `data-automation-id` property which allows it to be programmably found in tests

---

#### 🐛 Bug Fix

- Release main [#247](https://github.com/player-ui/player/pull/247) ([@intuit-svc](https://github.com/intuit-svc))
- Add Automation ID to Error Element in Storybook [#245](https://github.com/player-ui/player/pull/245) ([@KetanReddy](https://github.com/KetanReddy))
- iOS: port async WrappedFunction update [#244](https://github.com/player-ui/player/pull/244) ([@hborawski](https://github.com/hborawski))
- iOS: rewrite publisher assertions to be async [#234](https://github.com/player-ui/player/pull/234) ([@hborawski](https://github.com/hborawski))
- Fix PR Titles Created During Release [#242](https://github.com/player-ui/player/pull/242) ([@KetanReddy](https://github.com/KetanReddy))

#### 🏠 Internal

- Update auto version. Filter release trigger from changelogs [#243](https://github.com/player-ui/player/pull/243) ([@adierkens](https://github.com/adierkens))

#### 📝 Documentation

- Update broken link in contributing docs [#238](https://github.com/player-ui/player/pull/238) ([@adierkens](https://github.com/adierkens))

#### Authors: 4

- [@intuit-svc](https://github.com/intuit-svc)
- Adam Dierkens ([@adierkens](https://github.com/adierkens))
- Harris Borawski ([@hborawski](https://github.com/hborawski))
- Ketan Reddy ([@KetanReddy](https://github.com/KetanReddy))

---

# 0.4.2 (Thu Nov 16 2023)

### Release Notes

#### Add better error messaging for failed expression eval and parsing ([#239](https://github.com/player-ui/player/pull/239))

Improved error messages for parse and eval failures for expressions

---

#### 🐛 Bug Fix

- Release ${GITHUB_REF##*/} [#241](https://github.com/player-ui/player/pull/241) ([@intuit-svc](https://github.com/intuit-svc))
- adding swiftuipendingtransactionplugin [#237](https://github.com/player-ui/player/pull/237) ([@zwu011](https://github.com/zwu011) [@nancywu1](https://github.com/nancywu1))
- Add better error messaging for failed expression eval and parsing [#239](https://github.com/player-ui/player/pull/239) ([@adierkens](https://github.com/adierkens))

#### Authors: 4

- [@intuit-svc](https://github.com/intuit-svc)
- [@nancywu1](https://github.com/nancywu1)
- [@zwu011](https://github.com/zwu011)
- Adam Dierkens ([@adierkens](https://github.com/adierkens))

---

# 0.4.1 (Wed Nov 15 2023)

### Release Notes

#### Pin @moncao-editor/react to non `.mjs` Only Version ([#230](https://github.com/player-ui/player/pull/230))

Pin `@moncao-editor/react` to `4.3.1`

---

#### 🐛 Bug Fix

- Release ${GITHUB_REF##*/} [#236](https://github.com/player-ui/player/pull/236) ([@intuit-svc](https://github.com/intuit-svc))
- build: comment out major doc deploy for now [#235](https://github.com/player-ui/player/pull/235) ([@hborawski](https://github.com/hborawski))
- Release ${GITHUB_REF##*/} [#233](https://github.com/player-ui/player/pull/233) ([@intuit-svc](https://github.com/intuit-svc))
- remove version prefix from doc release path [#232](https://github.com/player-ui/player/pull/232) ([@hborawski](https://github.com/hborawski))
- iOS: Update precompile script to source zshrc [#226](https://github.com/player-ui/player/pull/226) ([@hborawski](https://github.com/hborawski))
- Release ${GITHUB_REF##*/} [#231](https://github.com/player-ui/player/pull/231) ([@intuit-svc](https://github.com/intuit-svc))
- Pin @moncao-editor/react to non `.mjs` Only Version [#230](https://github.com/player-ui/player/pull/230) ([@KetanReddy](https://github.com/KetanReddy))

#### Authors: 3

- [@intuit-svc](https://github.com/intuit-svc)
- Harris Borawski ([@hborawski](https://github.com/hborawski))
- Ketan Reddy ([@KetanReddy](https://github.com/KetanReddy))

---

# 0.3.0 (Thu Nov 03 2022)

#### 🚀 Enhancement

- Core package organization, and renaming to `ReactPlayer` [#93](https://github.com/player-ui/player/pull/93) ([@adierkens](https://github.com/adierkens))
- Enhancement/Parser Rewrite for plugins [#80](https://github.com/player-ui/player/pull/80) (marlon_ercillo@intuit.com [@mercillo](https://github.com/mercillo))

#### 🐛 Bug Fix

- Release main [#101](https://github.com/player-ui/player/pull/101) ([@intuit-svc](https://github.com/intuit-svc))
- Update documentation [#96](https://github.com/player-ui/player/pull/96) ([@KVSRoyal](https://github.com/KVSRoyal))
- run a separate workflow for forked PRs without write capable cache keys [#97](https://github.com/player-ui/player/pull/97) ([@hborawski](https://github.com/hborawski))
- [iOS] relax requirements for sending beacon metadata [#88](https://github.com/player-ui/player/pull/88) ([@hborawski](https://github.com/hborawski))
- [iOS] fix TestPlayer test helper dependency [#83](https://github.com/player-ui/player/pull/83) ([@hborawski](https://github.com/hborawski))
- [iOS] fix runtime warnings for published variables in Xcode14 [#84](https://github.com/player-ui/player/pull/84) ([@hborawski](https://github.com/hborawski))
- [iOS] make some additional properties public [#82](https://github.com/player-ui/player/pull/82) ([@hborawski](https://github.com/hborawski))
- change platform groupid [#81](https://github.com/player-ui/player/pull/81) (sentony03@gmail.com [@brocollie08](https://github.com/brocollie08))
- [iOS] add registerPlugin(_:) to HeadlessPlayer API [#79](https://github.com/player-ui/player/pull/79) ([@hborawski](https://github.com/hborawski))
- Cleanup Android dependencies [#77](https://github.com/player-ui/player/pull/77) ([@sugarmanz](https://github.com/sugarmanz))

#### 📝 Documentation

- Docs: fix sidenav scrolling on mobile [#100](https://github.com/player-ui/player/pull/100) ([@adierkens](https://github.com/adierkens))
- Add algolia search to /latest/ site [#76](https://github.com/player-ui/player/pull/76) ([@adierkens](https://github.com/adierkens))

#### Authors: 9

- [@brocollie08](https://github.com/brocollie08)
- [@intuit-svc](https://github.com/intuit-svc)
- Adam Dierkens ([@adierkens](https://github.com/adierkens))
- brocollie08 (sentony03@gmail.com)
- Harris Borawski ([@hborawski](https://github.com/hborawski))
- Jeremiah Zucker ([@sugarmanz](https://github.com/sugarmanz))
- Kori South ([@KVSRoyal](https://github.com/KVSRoyal))
- Marlon Ercillo ([@mercillo](https://github.com/mercillo))
- mercillo (marlon_ercillo@intuit.com)

---

# 0.2.0 (Tue Aug 30 2022)

#### 🚀 Enhancement

- Sync changes up to 57537b9 [#69](https://github.com/player-ui/player/pull/69) ([@adierkens](https://github.com/adierkens))

#### 🐛 Bug Fix

- Remove exit on error flag in release script [#75](https://github.com/player-ui/player/pull/75) ([@adierkens](https://github.com/adierkens))
- Release main [#73](https://github.com/player-ui/player/pull/73) ([@intuit-svc](https://github.com/intuit-svc))
- add delay before screenshotting for animations to finish [#72](https://github.com/player-ui/player/pull/72) ([@hborawski](https://github.com/hborawski))
- Release main [#71](https://github.com/player-ui/player/pull/71) ([@intuit-svc](https://github.com/intuit-svc))
- split out test helper functionality so XCTest isn't a hard requirement [#70](https://github.com/player-ui/player/pull/70) ([@hborawski](https://github.com/hborawski))
- Remove unused react-types package [#68](https://github.com/player-ui/player/pull/68) ([@adierkens](https://github.com/adierkens))
- switch removal from empty node [#67](https://github.com/player-ui/player/pull/67) (marlon_ercillo@intuit.com [@mercillo](https://github.com/mercillo))
- upgrade to xcode 13.4.1 [#65](https://github.com/player-ui/player/pull/65) ([@hborawski](https://github.com/hborawski))
- dont use bazel to push since the stamping wont work after shipit [#63](https://github.com/player-ui/player/pull/63) ([@hborawski](https://github.com/hborawski))
- try/catch pod push in plugin [#62](https://github.com/player-ui/player/pull/62) ([@hborawski](https://github.com/hborawski))
- move pod push to afterShipIt to have upload-assets finish first [#61](https://github.com/player-ui/player/pull/61) ([@hborawski](https://github.com/hborawski))
- Add workflow for fixing tags after failed release [#60](https://github.com/player-ui/player/pull/60) ([@adierkens](https://github.com/adierkens))
- fix pod release plugin [#59](https://github.com/player-ui/player/pull/59) ([@hborawski](https://github.com/hborawski))
- add local auto plugin to run bazel pod push after release [#57](https://github.com/player-ui/player/pull/57) ([@hborawski](https://github.com/hborawski))
- Fix the bin entry for the cli [#58](https://github.com/player-ui/player/pull/58) ([@adierkens](https://github.com/adierkens))
- allow caching ios tests again [#56](https://github.com/player-ui/player/pull/56) ([@hborawski](https://github.com/hborawski))
- set applitools env variables for iOS tests [#27](https://github.com/player-ui/player/pull/27) ([@hborawski](https://github.com/hborawski))
- fix IR backend for kotlinx serialization [#55](https://github.com/player-ui/player/pull/55) ([@sugarmanz](https://github.com/sugarmanz))
- Add subpath support for published docs [#54](https://github.com/player-ui/player/pull/54) ([@adierkens](https://github.com/adierkens))
- enhance error state deserialization & stacktrace logging in player view model [#50](https://github.com/player-ui/player/pull/50) ([@sugarmanz](https://github.com/sugarmanz))

#### 📝 Documentation

- added templates to content navigation, fixed the link to reference as… [#51](https://github.com/player-ui/player/pull/51) (marlon_ercillo@intuit.com [@mercillo](https://github.com/mercillo))

#### Authors: 6

- [@intuit-svc](https://github.com/intuit-svc)
- Adam Dierkens ([@adierkens](https://github.com/adierkens))
- Harris Borawski ([@hborawski](https://github.com/hborawski))
- Jeremiah Zucker ([@sugarmanz](https://github.com/sugarmanz))
- Marlon Ercillo ([@mercillo](https://github.com/mercillo))
- mercillo (marlon_ercillo@intuit.com)

---

# 0.1.0 (Tue Aug 02 2022)

### Release Notes

#### Fix version stamping. Add stamping to nextjs docs ([#11](https://github.com/player-ui/player/pull/11))

- Fixes the stamping for version and sha in `core` and `web` modules
- Stamps the nextjs docs for analytics id

#### NPM publishing support ([#3](https://github.com/player-ui/player/pull/3))

Adding build integration to publish all js packages to `npm`

---

#### 🚀 Enhancement

- Migrate from tapable to tapable-ts [#14](https://github.com/player-ui/player/pull/14) ([@adierkens](https://github.com/adierkens))

#### 🐛 Bug Fix

- Release main [#45](https://github.com/player-ui/player/pull/45) ([@intuit-svc](https://github.com/intuit-svc))
- rebuild pod zip in release [#43](https://github.com/player-ui/player/pull/43) ([@hborawski](https://github.com/hborawski))
- Publish vscode extension [#42](https://github.com/player-ui/player/pull/42) ([@adierkens](https://github.com/adierkens))
- persist iOS zip from iOS part of build [#41](https://github.com/player-ui/player/pull/41) ([@hborawski](https://github.com/hborawski))
- remove version prefix [#40](https://github.com/player-ui/player/pull/40) ([@hborawski](https://github.com/hborawski))
- add release flag to run command [#39](https://github.com/player-ui/player/pull/39) ([@hborawski](https://github.com/hborawski))
- add proper flag to build for podspec stamping [#38](https://github.com/player-ui/player/pull/38) ([@hborawski](https://github.com/hborawski))
- rebuild the podspec, not the pod [#37](https://github.com/player-ui/player/pull/37) ([@hborawski](https://github.com/hborawski))
- change version to placeholder for stamping [#36](https://github.com/player-ui/player/pull/36) ([@hborawski](https://github.com/hborawski))
- change version to placeholder for stamping [#35](https://github.com/player-ui/player/pull/35) ([@hborawski](https://github.com/hborawski))
- update rules_player to 0.5.1 [#34](https://github.com/player-ui/player/pull/34) ([@hborawski](https://github.com/hborawski))
- read sha as batch id [#31](https://github.com/player-ui/player/pull/31) ([@sugarmanz](https://github.com/sugarmanz))
- Update default sideEffects flag for npm packages [#33](https://github.com/player-ui/player/pull/33) ([@adierkens](https://github.com/adierkens))
- get directory of script instead of relative path [#30](https://github.com/player-ui/player/pull/30) ([@hborawski](https://github.com/hborawski))
- Port android changes [#29](https://github.com/player-ui/player/pull/29) (sentony03@gmail.com [@brocollie08](https://github.com/brocollie08))
- dont persist everything, just the ios-build-number [#28](https://github.com/player-ui/player/pull/28) ([@hborawski](https://github.com/hborawski))
- CocoaPod publishing [#20](https://github.com/player-ui/player/pull/20) ([@hborawski](https://github.com/hborawski))
- Applitools Test [#10](https://github.com/player-ui/player/pull/10) (sentony03@gmail.com [@sugarmanz](https://github.com/sugarmanz) [@brocollie08](https://github.com/brocollie08))
- Sync updates [#26](https://github.com/player-ui/player/pull/26) ([@adierkens](https://github.com/adierkens))
- Fix validation namespace collision in compiled module [#25](https://github.com/player-ui/player/pull/25) ([@adierkens](https://github.com/adierkens))
- bring over latest jvm code [#22](https://github.com/player-ui/player/pull/22) ([@sugarmanz](https://github.com/sugarmanz))
- Use remote caching for bazel targets [#21](https://github.com/player-ui/player/pull/21) ([@adierkens](https://github.com/adierkens))
- Add missing package.json attrs [#15](https://github.com/player-ui/player/pull/15) ([@adierkens](https://github.com/adierkens))
- fix maven repos [#18](https://github.com/player-ui/player/pull/18) ([@sugarmanz](https://github.com/sugarmanz))
- import GPG key [#17](https://github.com/player-ui/player/pull/17) ([@sugarmanz](https://github.com/sugarmanz))
- configure JAR publishing to Maven Central via rules [#16](https://github.com/player-ui/player/pull/16) ([@sugarmanz](https://github.com/sugarmanz))
- Fix version stamping. Add stamping to nextjs docs [#11](https://github.com/player-ui/player/pull/11) ([@adierkens](https://github.com/adierkens))
- Analytics for docs [#9](https://github.com/player-ui/player/pull/9) ([@adierkens](https://github.com/adierkens))
- Fix peer dependency in metrics plugin [#6](https://github.com/player-ui/player/pull/6) ([@adierkens](https://github.com/adierkens))
- Bump rules_player. Fix package.json generation [#5](https://github.com/player-ui/player/pull/5) ([@adierkens](https://github.com/adierkens))
- Add registry to cli pkg [#4](https://github.com/player-ui/player/pull/4) ([@adierkens](https://github.com/adierkens))
- NPM publishing support [#3](https://github.com/player-ui/player/pull/3) ([@adierkens](https://github.com/adierkens))

#### ⚠️ Pushed to `main`

- Update build dependencies ([@adierkens](https://github.com/adierkens))
- project scaffold ([@intuit-svc](https://github.com/intuit-svc))

#### 🏠 Internal

- Reorder docs match for CODEOWNERS [#23](https://github.com/player-ui/player/pull/23) ([@adierkens](https://github.com/adierkens))
- Update code-owners [#8](https://github.com/player-ui/player/pull/8) ([@adierkens](https://github.com/adierkens))

#### 📝 Documentation

- Fix formatting in getting-started docs [#7](https://github.com/player-ui/player/pull/7) ([@adierkens](https://github.com/adierkens))

#### Authors: 6

- [@brocollie08](https://github.com/brocollie08)
- [@intuit-svc](https://github.com/intuit-svc)
- Adam Dierkens ([@adierkens](https://github.com/adierkens))
- brocollie08 (sentony03@gmail.com)
- Harris Borawski ([@hborawski](https://github.com/hborawski))
- Jeremiah Zucker ([@sugarmanz](https://github.com/sugarmanz))
