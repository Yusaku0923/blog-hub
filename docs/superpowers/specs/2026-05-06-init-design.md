# blog-hub — Init Design Spec

- **作成日**: 2026-05-06
- **ステータス**: ⚠️ **Superseded by [`2026-05-06-platform-architecture-design.md`](./2026-05-06-platform-architecture-design.md)**（同日中に refine された）
- **経緯**: PetGurashi セッション中に「複数ブログを統括する管理ハブが必要」と判明し、別PJとして派生

> **読み手への注意**: 本 spec は方向性合意の最初のスナップショット。
> その後 platform-architecture-design.md で次の点が確定/変更されている:
> - 対象サイトを **PetGurashi 単独** に縮小（LicenseHub 除外）
> - 編集レイヤーは引き続き既製 CMS、ただし **プラットフォーム自体は monorepo（blog-base Layer + hub）**
> - CMS 選定は **M5 で PoC**（本 spec §7-A の評価軸は platform spec §10-A に転記済み）
> - スキーマ二重化は **(a) zod ソースオブトゥルース** に確定
> - 認証は **Cloudflare Access + GitHub OAuth**、データは **D1 + KV**
>
> 以下の本文は記録として残す。実装方針は platform spec を参照すること。

## 1. 背景と目的

PetGurashi（ペット用品ブログ、Nuxt 3 SSG）の運用を進める中で、次の課題が顕在化した。

- **Claude Code 前提だと運用者を増やせない** — 記事編集・公開フローが CLI / Claude Code を前提としており、非エンジニアの寄稿者・編集者が単独で更新できない
- **サイトが増えると管理が破綻する** — PetGurashi に加え、LicenseHub やその他の同型ブログを並走させる構想で、各サイトを個別に Claude Code で操作するのは現実的でない

これを解決するため、同型ブログサイト群を **1つのGUI** から：

- 非エンジニアでも編集・公開できる
- サイトを横断して分析・俯瞰できる
- ブログ追加が低コストで済む

ようにする「ハブ」を別プロジェクトとして構築する。

## 2. 対象サイト

**第一バッチ**:

- **PetGurashi** — pet-gurashi.com / Nuxt 3 + @nuxt/content v3 + Cloudflare Pages
- **LicenseHub** — 同等構成（バージョン要確認）

**将来**: 同型のブログサイトを追加可能な拡張性を最初から組み込む。

> 対象サイトの正式インベントリ（リポURL / Nuxt バージョン / Content スキーマ / デプロイ環境）は M1 で別途まとめる。

## 3. ペルソナ

| ペルソナ | 役割 | 必要な機能 |
|---------|------|----------|
| **管理者**（user 本人） | サイト追加・横断分析・編集も行う | 全機能 |
| **編集者**（非エンジニア協力者） | 記事の作成・編集・公開 | 編集 / 画像 / 自分のサイトの分析 |

認証はGitHub OAuth前提（Git-based CMSの一般的な方式）。編集者にも GitHub アカウントが必要になる点はオンボーディング上の制約として認識。

## 4. 機能優先度

### Must（初期リリース）

1. **記事編集UI** — Markdown構文を露出しないWYSIWYG寄り。frontmatterは構造化フォームで入力。MDCコンポーネント（`::faq-section`, `::product-card` 等）はパレットから挿入できる
2. **画像管理** — アップロード／既存ライブラリから選択／自動WebP変換／OGP生成連携
3. **サイト一覧・追加・切替** — マルチサイト前提のナビゲーション
4. **分析パネル** — GA4 + Google Search Console の主要KPI（PV / 検索順位 / クエリ）をサイト別に表示

### Nice-to-have

5. **KW調査支援** — 編集中にサイドパネルで関連KWを表示
6. **デプロイ可視化** — Cloudflare Pages のビルド状態・成否

### 範囲外

- KW調査スクリプト・画像取得スクリプトなどパイプライン自動化（Claude Code側に継続）
- 多言語対応（最初は日本語のみ）
- 寄稿者間のコメント・レビューフロー（v2以降）

## 5. 採用方針

**案1: マルチリポ対応CMS + 薄い独自分析ラッパー**

```
+--------------------------+
|   分析ダッシュボード      |   ← 自前実装（GA4 / GSC API）
+--------------------------+
|   編集レイヤー            |   ← 既製マルチリポ対応CMS（PoCで選定）
+--------------------------+
            ↕ GitHub API
+--------------------------+
| PetGurashi / LicenseHub  |   ← 各サイトのリポ（content/ を編集対象）
+--------------------------+
```

**採用理由**:

- 編集UIを自作しない → 工数最小化
- マルチサイト対応がCMSにビルトイン → サイト追加が楽
- 独自実装は分析ダッシュボードに閉じる

**トレードオフ**:

- 既製CMSと `@nuxt/content` v3 の zod スキーマで定義の二重化が起きる懸念（§7-B 参照）

## 6. アーキテクチャ初期案

| 層 | 技術候補 | 役割 |
|---|---------|------|
| 編集レイヤー | Pages CMS / Sveltia / Keystatic / TinaCMS（PoCで選定） | Markdown + frontmatter編集、画像、Git push |
| 分析ダッシュボード | Nuxt 3 / Next / SvelteKit いずれか（編集レイヤーに合わせる） | GA4 Data API / Search Console API のラッパー |
| 認証 | GitHub OAuth（CMS側） + 分析側は Cloudflare Access 等 | |
| ホスティング | Cloudflare Pages（PetGurashi / LicenseHub と同基盤） | |
| データ保管 | 編集対象 = 対象サイトのリポ（state-less） / 分析キャッシュ = Cloudflare KV or D1 | |

## 7. オープン課題（PoCで決める）

### A. 編集レイヤーの選定

| 候補 | マルチリポ | 非エンジニア度 | OSS活発度 | 商用課金 |
|------|----------|------------|---------|--------|
| Pages CMS | ◎（設計から） | ○ | △（新しめ） | 不要 |
| Sveltia CMS | △（複数config併用） | ○ | ◎ | 不要 |
| Keystatic | △（マルチプロジェクトは設計次第） | △（schema-driven） | ◎ | 不要 |
| TinaCMS | ◎（Tina Cloud） | ◎（live preview） | ◎ | あり（Cloud） |

**PoC評価軸**:

- `@nuxt/content` の zod スキーマと折り合うか（frontmatter 整合性）
- MDCコンポーネント（`::faq-section` 等）を編集UIから挿入できるか
- Cloudflare Pages 上でホスト可能か
- 非エンジニアの操作感

### B. スキーマの一元管理

`@nuxt/content` の `content.config.ts`（zod）とCMS側のスキーマ定義が二重化する。次のいずれかで解決：

- **(a)** zod をソースオブトゥルースとし、CMS設定を生成する変換層を書く
- **(b)** CMS設定をソースとし、`@nuxt/content` 側の zod を緩める
- **(c)** 両方を別管理し、CIで整合性チェックする

### C. ハブと対象サイトの関係

- ハブ → 対象サイトリポは GitHub API 経由で書き込み（CMSの標準動作）
- 対象サイトの Cloudflare Pages 自動デプロイは既存通り（push トリガー）
- 「サイトをハブに登録する」手順を最小化する仕組み（YAML設定1ファイルで完結等）を要設計

## 8. マイルストーン

| M | 内容 |
|---|------|
| M1 | 対象サイトインベントリ + PoC計画書 |
| M2 | 編集レイヤー候補2-3個を PetGurashi で実装PoC（動く管理画面で1記事編集できるまで） |
| M3 | 編集レイヤー確定 + 分析ダッシュボード骨組み |
| M4 | PetGurashi 本番投入 — 編集者が単独で1記事更新可能 |
| M5 | LicenseHub 追加 — マルチサイト運用検証 |
| M6 | v1リリース — Cloudflare Pages 本番ホスト、認証整備 |

各 M ごとに spec → plan → 実装サイクルを回す。

## 9. リスク

| リスク | 影響 | 対策 |
|--------|------|------|
| 既製CMSが `@nuxt/content` v3 と相性が悪い | PoC で判明 → 案2/3 に切替検討 | PoC を早期に回す |
| 編集者のGitHubアカウント要件が現実的でない | オンボーディング阻害 | プロキシ層で代理pushする代替案を保留 |
| Cloudflare Pages のCMSホスト制約 | デプロイ困難 | Cloudflare Pages Functions / Workers を活用 / 最悪 Vercel |
| 分析APIのレート制限・費用 | 表示遅延・課金発生 | キャッシュ層を設計時から組み込む |

## 10. 非ゴール（YAGNI）

- 完全自動化（記事生成・自動投稿）
- アフィリエイト管理機能
- 多言語ローカライゼーション
- ロールベース権限の細分化（v1 は admin / editor の2区分のみ）

---

**次のステップ**: ユーザレビュー → 承認後 commit → `gh repo create` → M1（インベントリ + PoC計画）の writing-plans ブレストへ。
