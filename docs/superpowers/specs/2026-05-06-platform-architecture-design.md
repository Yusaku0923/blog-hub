# blog-platform — Architecture Design Spec

- **作成日**: 2026-05-06
- **ステータス**: ブレスト確定（実装プラン作成前）
- **前提**: `2026-05-06-init-design.md`（init spec）の方針を一段具体化したもの。init spec から変更/確定した点を §0 にまとめる。

## 0. init spec からの変更点

| init spec の前提 | 本 spec での確定 |
|----------------|----------------|
| 対象サイト = PetGurashi + LicenseHub | **PetGurashi のみ**。LicenseHub は形式不一致のため除外 |
| 既製マルチリポ CMS で編集レイヤー全部委譲 | 編集レイヤーは CMS 委譲、**プラットフォーム自体は自社モノレポ**を持つ（PetGurashi をテンプレ化して新サイトを増やす方針） |
| §7-A: CMS 候補4つから PoC 選定 | **未確定（M5 で確定）** — 評価軸を §10-A に明文化 |
| §7-B: スキーマ二重化の解 | **(a) zod をソースオブトゥルース** に寄せる方針を採用、具体策は CMS 選定後 |
| §7-C: サイト登録の最小化 | **テンプレリポ + hub の登録フォーム1枚** で完結（§5, §7） |
| §6 編集レイヤー候補のホスト先 | hub 自体は **Cloudflare Pages + D1 + KV**、auth は Cloudflare Access |

## 1. 採用アーキテクチャの全体像

```
github.com/<user>/blog-platform           ← モノレポ（開発者向け、private）
├── packages/
│   └── blog-base/                        ← Nuxt Layer：エンジン + プリミティブ + shell + zod 幹（schema は内包）
└── apps/
    └── hub/                              ← 分析ダッシュボード + サイト一覧 + CMS deep link

# 将来分離候補:
# - packages/content-schema/  （CMS 側が独立 import を要求した場合）
# - apps/analytics-api/        （hub の API 部分が独立 service 化する場合）

github.com/<user>/pet-gurashi             ← 既存リポ。blog-base を extends に refactor
github.com/<user>/blog-site-template      ← 新サイト雛形リポ
github.com/<user>/<future-site-N>         ← template 複製で増やす
```

**設計指針**:

- 「**base = エンジン + 部品 + 契約**」「**site = 見た目 + 語彙 + 内容**」の責務分離
- **Layer 配布は git URL extend**（`extends: 'github:org/repo/subdir#sha'`）。npm publish しない
- hub は **編集 UI を持たない**。編集は CMS、hub は分析と導線
- **新サイト立ち上げは半日〜1日**（template 複製 → CSS 変数値 + app.config + Header/Footer 編集）

## 2. `blog-base` パッケージ構成

```
packages/blog-base/
├── nuxt.config.ts                       ← Layer partial：modules / image / fonts default / content / nitro.preset / typescript
├── content/
│   └── schema.ts                        ← export { baseSchema }
├── composables/
│   ├── useStructuredData.ts             ← JSON-LD（Article + Breadcrumb）
│   ├── useSiteConfig.ts                 ← useAppConfig().site の wrapper
│   └── useCategoryLabel.ts              ← (key) => useSiteConfig().categoryLabels[key] ?? key
├── pages/
│   └── [...slug].vue                    ← 汎用 catch-all（categoryLabels は composable 経由で注入）
├── layouts/
│   └── default.vue                      ← shell only：header/footer/mobile を slot 化
├── components/
│   ├── article/ArticleCard.vue
│   ├── content/                         ← affiliate デフォルトの MDC（FaqSection / ProductCard / ProductCompare / RelatedProducts）
│   └── home/                            ← TOP 用ビルディングブロック
│       ├── LatestArticleGrid.vue
│       └── TagCloud.vue
├── assets/css/base.css                  ← @tailwind directives + CSS 変数の宣言（値は site が override）
├── tailwind/preset.ts                   ← Tailwind preset：色/font は CSS 変数参照に抽象化
├── types/app-config.d.ts                ← AppConfig.site の型定義
└── package.json
```

### 2.1 Tailwind preset と CSS 変数の二段構え

```ts
// blog-base/tailwind/preset.ts
export default {
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)', paper: 'var(--color-paper)',
        ink: 'var(--color-ink)', muted: 'var(--color-muted)',
        line: 'var(--color-line)', tag: 'var(--color-tag)',
        accent: 'var(--color-accent)', accent2: 'var(--color-accent2)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        body:    'var(--font-body)',
        mono:    'var(--font-mono)',
      },
    },
  },
}
```

site は `assets/css/main.css` で **CSS 変数の値だけ**書けば全部入れ替わる。token 名（`bg-paper`, `text-accent` 等）は base が決め、PetGurashi 既存のクラス利用はそのまま動く。

### 2.2 `content/schema.ts` の export 形

```ts
import { z } from '@nuxt/content'   // base からも @nuxt/content の z を使う

export const baseSchema = z.object({
  title:       z.string().min(10).max(40),
  description: z.string().min(40).max(140),
  tags:        z.array(z.string()).default([]),
  date:        z.coerce.date(),
  created:     z.coerce.date(),
  listed:      z.boolean().default(true),
  toc:         z.boolean().default(true),
  draft:       z.boolean().default(false),
  pageType:    z.enum(['article','category']).default('article'),
  heroImage:   z.string().optional(),
})
```

site は `baseSchema.extend({ category: z.enum([...]), pet: z.enum([...]) })` で拡張。

### 2.3 layout の slot 化

```vue
<!-- blog-base/layouts/default.vue -->
<div class="min-h-screen bg-bg text-ink font-body flex flex-col pb-16 md:pb-0">
  <slot name="header" />
  <main class="flex-1"><slot /></main>
  <slot name="footer" />
  <slot name="mobile" />
</div>
```

site は `app.vue` で各 slot を埋める。

## 3. site リポの形

### 3.1 PetGurashi（refactor 後）

```
pet-gurashi/
├── nuxt.config.ts                       ← extends + site 固有 override（fonts.families / site.url / prerender.routes）
├── app.config.ts                        ← site 語彙（categoryLabels / navItems / masthead）
├── app.vue                              ← layout slot を埋める
├── content.config.ts                    ← baseSchema.extend({ category, pet })
├── tailwind.config.ts                   ← base preset を継承 + content paths
├── assets/css/main.css                  ← CSS 変数の値（terracotta theme）
├── components/
│   ├── layout/{SiteHeader,SiteFooter}.vue
│   └── mobile/{BottomNav,MobileMenu}.vue
├── pages/index.vue                      ← TOP（base の <LatestArticleGrid /> 等を組み合わせ）
├── public/{_redirects, og-default.png, og/, images/}
├── content/                             ← 記事（一切変更なし）
└── package.json                         ← base への依存は package.json ではなく nuxt.config.ts の extends で解決
```

**行数の見立て**: 残置 ≈ 350 行（TOP 129 + layout/mobile 4部品 143 + config 50 + app.vue + assets/css 30）。`content/` は 1 行も触らない。

### 3.2 `nuxt.config.ts`（PetGurashi）

```ts
export default defineNuxtConfig({
  extends: ['github:<user>/blog-platform/packages/blog-base#<sha>'],
  compatibilityDate: '2026-04-20',
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://pet-gurashi.com',
    name: 'ペットぐらし',
  },
  runtimeConfig: {
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://pet-gurashi.com',
    },
  },
  fonts: {
    families: [
      { name: 'Klee One',            provider: 'google', weights: [400, 600], display: 'swap', global: true },
      { name: 'Zen Maru Gothic',     provider: 'google', weights: [400, 700], display: 'swap', global: true },
      { name: 'Noto Serif JP',       provider: 'google', weights: [400],      display: 'swap', global: true },
      { name: 'Zen Kaku Gothic New', provider: 'google', weights: [400],      display: 'swap', global: true },
    ],
  },
  nitro: {
    prerender: { failOnError: false, crawlLinks: true, routes: ['/', '/dog/daily'] },
  },
})
```

### 3.3 `app.config.ts`（PetGurashi）

```ts
export default defineAppConfig({
  site: {
    categoryLabels: {
      daily: '毎日の暮らし', outing: 'お出かけ', health: '健康・介護',
      starter: 'はじめて飼う', furniture: '猫家具', compare: '比較',
      '100kin': '100均', column: 'コラム',
    },
    navItems: [
      { label: 'HOME', to: '/' },
      { label: '犬',   to: '/dog' },
      { label: '猫',   to: '/cat' },
      { label: '比較', to: '/compare' },
      { label: '100均', to: '/100kin' },
      { label: 'ABOUT', to: '/about' },
    ],
    masthead: {
      tagline: '— A JOURNAL FOR PET LOVERS —',
      subtitle: 'ペットと暮らす、大人のための雑誌',
      volumeBanner: 'EST. 2026 — MIDDLE-LIFE PET LIVING JOURNAL',
      volumeStartYear: 2026,
    },
  },
})
```

### 3.4 `blog-site-template`

```
blog-site-template/
├── nuxt.config.ts                       ← extends + 最小 site 値（プレースホルダ）
├── app.config.ts                        ← 空テンプレ
├── app.vue                              ← layout slot を埋める基本形
├── content.config.ts                    ← baseSchema をそのまま（.extend 例コメント付き）
├── tailwind.config.ts                   ← base preset + content paths
├── assets/css/main.css                  ← CSS 変数のデフォルト値（neutral palette）
├── components/
│   ├── layout/{SiteHeader,SiteFooter}.vue   ← 最小実装
│   └── mobile/                              ← 空
├── pages/index.vue                      ← <LatestArticleGrid /> + <TagCloud /> だけの最小TOP
├── public/{_redirects, og-default.png}
├── content/example/welcome.md           ← サンプル記事1本
├── README.md                            ← セットアップ手順
└── package.json
```

**新サイト立ち上げ手順**:

```bash
gh repo create my-new-blog --template <user>/blog-site-template --private
cd my-new-blog
pnpm install
# 1. assets/css/main.css の CSS 変数値を編集（色）
# 2. app.config.ts の categoryLabels / navItems / masthead を編集
# 3. components/layout/SiteHeader.vue のロゴ・文言を編集
# 4. content.config.ts に必要なら .extend
# 5. pages/index.vue の hero 部分を編集
# 6. pnpm dev で確認
```

## 4. hub アプリ

### 4.1 役割

| 担う | 担わない |
|------|---------|
| サイト一覧 / 切替 | 記事編集 UI（CMS に委譲） |
| 横断分析（GA4 + GSC） | 画像管理 UI（CMS に委譲） |
| サイト登録 / 設定管理 | KW 調査支援（範囲外） |
| デプロイ可視化（Nice-to-have） | 認証実装（Cloudflare Access に委譲） |

### 4.2 実装スタック

| 層 | 採用 |
|---|---|
| フロント | Nuxt 3（blog-base の component を再利用しやすい） |
| API | Nuxt server routes（`apps/hub/server/api/*`、最初は別 service 不要） |
| 認証 | Cloudflare Access（GitHub OAuth 連携） |
| データ保管 | Cloudflare D1（SQLite） |
| キャッシュ | Cloudflare KV（GA/GSC レスポンス TTL 5-15分） |
| ホスティング | Cloudflare Pages（Functions 同居） |

### 4.3 ページ構成（MVP）

```
apps/hub/pages/
├── index.vue                ← サイト一覧 + 全サイト合算 KPI
├── sites/[siteId]/
│   ├── index.vue            ← サイト個別ダッシュボード（PV / トップページ / 検索クエリ）
│   └── settings.vue         ← サイト設定（GA4 property / GSC site URL / リポ URL / CMS deep link）
└── sites/new.vue            ← 新サイト登録フォーム
```

### 4.4 サイト登録モデル

```sql
CREATE TABLE sites (
  id TEXT PRIMARY KEY,                 -- e.g. 'pet-gurashi'
  name TEXT NOT NULL,                  -- e.g. 'ペットぐらし'
  site_url TEXT NOT NULL,              -- https://pet-gurashi.com
  repo TEXT NOT NULL,                  -- <user>/pet-gurashi
  ga4_property_id TEXT,
  gsc_site_url TEXT,
  cms_url TEXT,                        -- CMS 上のサイト URL（deep link 用）
  cf_pages_project TEXT,               -- Cloudflare Pages プロジェクト名
  created_at INTEGER NOT NULL
);
```

### 4.5 分析 API ラッパー

- `server/api/analytics/[siteId]/overview.get.ts` — GA4 PV + GSC 検索流入
- `server/api/analytics/[siteId]/queries.get.ts` — GSC トップクエリ
- `server/api/analytics/[siteId]/pages.get.ts` — GA4 トップページ
- 全て KV キャッシュ、Cloudflare Access が前段で auth を済ませる前提

## 5. データフロー

```
編集者 / 管理者
├─→ CMS UI ────── GitHub API ────→ site リポ content/ ──→ git push ──→ CF Pages（各サイト）
├─→ hub UI ─────── GA4 / GSC API（KV キャッシュ経由）
└─→ GitHub（管理者は Claude Code 経由で直接編集）
```

各 site の Cloudflare Pages は既存通り push トリガーで auto deploy。

## 6. マイグレーション順序（M1〜M6）

| M | 名称 | 完了条件 |
|---|------|---------|
| **M1** | プラットフォーム雛形 | `pnpm install` & `pnpm typecheck` がモノレポルートで通る |
| **M2** | base 抽出 + PetGurashi refactor | PetGurashi が dev/build 成功、見た目 diff なし |
| **M3** | `blog-site-template` 作成 | template から `gh repo create` で空サイトが立つ |
| **M4** | hub MVP（分析側） | PetGurashi の PV / 検索クエリが hub に表示される |
| **M5** | CMS 選定 PoC | 編集者ペルソナで「1記事を作成→公開」が CMS UI から完結 |
| **M6** | 編集者運用開始 + v1 | hub に CMS 統合、非エンジニア編集者が PetGurashi の記事1本を公開 |

**並列性**: M4 と M5 は M2 完了後に並列実行可能。

```
M1 ─→ M2 ─→ M3 ──┐
            └──→ M4 ──┐
                 M5 ──┴──→ M6
```

### 6.1 M2（base 抽出）の細分化

PetGurashi は本番稼働中。refactor は **小さく・順に・検証しながら** 進める。`refactor/extract-base` ブランチで作業、各ステップで `pnpm build` + `pnpm preview` で目視確認、完了後にまとめて main マージ。

| # | 内容 | リスク | 検証 |
|---|------|------|------|
| 1 | モノレポ作成、`packages/blog-base/` に空 Layer をスキャフォールド | 極小 | typecheck |
| 2 | `composables/useStructuredData.ts` を base に移動、PetGurashi 側を import に置換 | 小 | JSON-LD 出力一致 |
| 3 | `content/schema.ts` を base に作成、PetGurashi `content.config.ts` を `baseSchema.extend()` に書き換え | 中 | build 成功・既存記事の frontmatter validation 通過 + **layer 跨ぎ named import (`import { baseSchema } from '@blog-platform/blog-base/content/schema'`) が解決されることを実地確認** |
| 4 | Tailwind preset 化（colors を CSS 変数参照に変換、`assets/css/main.css` で値定義） | 中 | 全ページ目視 diff |
| 5 | `components/content/{FAQ,Product,Compare,Related}.vue` を base に移動 | 中 | MDC 含む記事ページ目視 diff |
| 6 | `components/article/ArticleCard.vue` を base に移動 | 小 | カテゴリページ目視 diff |
| 7 | `pages/[...slug].vue` を base に移動、`categoryLabels` を `useCategoryLabel` 経由に | **大** | 全カテゴリ・全記事 目視 diff、breadcrumb / SEO meta 一致 |
| 8 | `layouts/default.vue` を base の slot 化版に置き換え、PetGurashi `app.vue` で slot 埋め | 中 | header/footer/mobile 表示崩れなし |
| 9 | `app.config.ts` 作成、Header/Footer の文字列リテラルを config 参照に置換 | 小 | 文言一致 |
| 10 | `pages/index.vue` を base の `<LatestArticleGrid />` + `<TagCloud />` 部品で書き直し | **大** | TOP の構造・並び・タグ抽出ロジック一致 |

**目視確認の最低セット**（毎ステップ後）: TOP `/` / 任意の記事 `/dog/daily/<slug>` / カテゴリ `/dog` / 404 `/no-such-path`

**ロールバック**: 各ステップで commit、壊れたら `git revert`。base 側の API が悪いと判明したら base を直して再試行（site 側を歪めない）。

## 7. サイト登録の最小化（§7-C の解）

新サイトを hub 管理下に入れる手順:

1. `gh repo create <slug> --template blog-site-template --private`
2. README 手順に従って編集（CSS 変数 / app.config / Header / TOP）
3. Cloudflare Pages でリポ接続
4. hub `/sites/new` で登録（name / site_url / repo / GA4 property / GSC URL / CMS URL / CF Pages プロジェクト名）

→ 1サイト追加 = **数時間〜半日**。

## 8. オープン課題（後続フェーズで決定）

### A. CMS 選定（M5 で PoC）

候補: Pages CMS / Sveltia CMS / Keystatic / TinaCMS

**評価軸（優先順）**:

1. `@nuxt/content` v3 zod スキーマと連携可能か
2. MDC コンポーネント挿入の UX
3. Cloudflare Pages 上でホスト可能 or 静的 SPA として CF 配信可能
4. マルチリポ UI（hub から deep link した際のサイト切替の自然さ）
5. 編集者の操作感（WYSIWYG 度、画像挿入、frontmatter フォーム）
6. OSS 活発度・将来の継続性

**PoC スコープ**: 候補を最小2、最大3。各々で「PetGurashi の既存記事1本を編集 → commit → CF Pages 反映」が完結するまで。所要 1-2日/候補。

### B. スキーマ二重化の最終解

§7-B (a) zod をソースオブトゥルース 方針。具体策は CMS 選定後に確定:

- 変換層あり / 変換層なし（CMS 設定を手書き）/ 片方緩める / CI で整合性チェック のいずれか

### C. 編集者の GitHub アカウント要件

受け入れる（オンボ手順をドキュメント化）。代替案（プロキシ層で代理 push）は v2 以降に保留。

### D. base の SHA pin 更新フロー

最初は手動。サイトが2つ以上になったら Renovate / Dependabot 自動化を検討。base 側で `base-v0.1.0` のような prefix tag を切る運用を導入。

### E. 画像管理の置き場

- Option 1: site リポの `public/images/` に直接 commit（PetGurashi 現状方式）
- Option 2: Cloudflare R2 / Images に保管、URL を frontmatter に書く

→ M5 PoC で CMS 候補ごとの挙動を見て決定。

### F. AppConfig 型拡張のクロスパッケージ動作確認

base が `AppConfig.site` の型を提供、site が `declare module 'nuxt/schema'` で具体値型を上書きする想定。M2 ステップ4-5 で実地確認。動かない場合は `useSiteConfig()` 戻り値を `Record<string, unknown>` で受けて site 側で as キャストする fallback。

## 9. 非ゴール（YAGNI / 範囲外）

init spec §10 を継承 + 追加:

- **LicenseHub の統合**（形式不一致のため除外）
- 多言語対応（日本語のみ）
- 完全自動化（記事生成・自動投稿）
- アフィリエイト管理機能（リンク管理 / 売上集計）
- ロール権限の細分化（admin / editor の2区分のみ）
- KW 調査・画像取得スクリプトの統合（Claude Code 側に残置）
- 寄稿者間のレビュー / コメントフロー（v2 以降）
- **base の npm publish パイプライン**（git URL extend で当面運用）
- **専用 module 化された語彙注入**（`app.config.ts` で十分）
- **non-affiliate 用の MDC コンポーネント分離**（必要になったら段階移行）

## 10. リスク

| リスク | 影響 | 対策 |
|--------|------|------|
| PetGurashi refactor で見た目 / SEO が壊れる | user-visible（本番稼働中） | M2 を10ステップに細分、各ステップで目視確認、`refactor/extract-base` ブランチで作業 |
| Layer 配布に git URL extend が実用的でない（特に layer 跨ぎ named import が解決されない可能性） | 実装方式を npm に変更 | M1 で extend 自体、M2 ステップ3 で named import 解決を確認、ダメなら早期に npm 化 or `#blog-base/*` 形式の Nuxt alias 経路に切替 |
| AppConfig 型拡張が Layer 跨ぎで効かない | 型安全性低下 | M2 ステップ4-5 で確認、ダメなら as キャスト fallback |
| 既製 CMS が `@nuxt/content` v3 と相性が悪い | M5 で判明 → 案2/3 切替 | PoC を早期に回す |
| 編集者の GitHub アカウント要件が現実的でない | オンボ阻害 | プロキシ層 push の代替案を v2 で検討 |
| 分析 API のレート制限・費用 | 表示遅延・課金 | KV キャッシュを設計時から組み込み |

---

**次のステップ**: ユーザレビュー → 承認後 commit → writing-plans skill で M1（プラットフォーム雛形）または M2（base 抽出）の実装プランを作成。
