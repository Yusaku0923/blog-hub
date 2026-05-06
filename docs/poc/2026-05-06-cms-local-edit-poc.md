# CMS local-edit PoC findings — Sveltia → Decap pivot

- **日付**: 2026-05-06
- **検証対象**: Init Spec §7-A の編集レイヤー候補（最初の一手として Sveltia CMS を試行）
- **検証ゴール**: blog-hub から PetGurashi の `content/` を GUI 経由で編集できるか
- **結果**: ✅ Decap CMS で end-to-end 動作確認。Sveltia は `local_backend` 非対応のため当初の経路では自動検証不能だった

## TL;DR

PetGurashi の content/ を **別リポ（blog-hub）から起動した GUI** で編集 → 実ファイルに書き込み、までを通しで動作させた。所要時間 30 分弱。
途中で Sveltia → Decap CMS にピボット（理由は §3）。Decap config.yml はそのまま Sveltia とも互換なので、後段の選定で Sveltia に戻すコストは低い。

## 1. 構成（最終形）

```
[Chromium]
  └─ http://localhost:3001/  ← Decap CMS admin（blog-hub/poc/sveltia/public/）
        └─ HTTP fetch → http://localhost:8082/api/v1
                         ↓
                       [decap-server]  ← PetGurashi で起動、CWD のファイルを読み書き
                         ↓
                       /Users/yusaku/projects/PetGurashi/content/**/*.md
```

ポイント:

- admin は blog-hub から配信、proxy は PetGurashi から起動 — 「Hub から他リポを操作する」本番想定の縮図として成立
- proxy は CWD を root として認識するので、対象サイトのリポルートで起動するのが必須要件
- 編集者ブラウザは admin と proxy の両方に同一マシンからアクセスする前提（リモートでは追加設計が要る — §6 参照）

## 2. 動作確認結果

| 項目 | 結果 | 備考 |
|------|------|------|
| admin 静的 HTML がブラウザに読み込まれる | ✅ | unpkg の CDN から `decap-cms.js` をロード |
| `local_backend` で proxy 経由ログイン | ✅ | Decap は `Login` ボタンで透過的にローカルモードへ |
| 3コレクション（dog_daily / dog_starter / cat_daily）が表示される | ✅ | config.yml の `folder:` が PetGurashi 相対パスで正しく解決 |
| 既存記事一覧の取得 | ✅ | `dog/daily` 以下の `.md` が全て認識（dental-care / dog-food / index / poop-cleanup / recommended-goods / sample / walk-harness）|
| `sample.md` を開いた際の frontmatter 全フィールド populate | ✅ | string / text / select / list / datetime / boolean / image / markdown 全て正しい widget で復元 |
| プレビュー pane の表示 | △ | iframe 内で markdown レンダリングは出るが、画像 (`/images/articles/...`) は admin server 側に存在しないため 404 |
| 本文編集 + Publish 押下 → ファイル書き込み | ✅ | mtime が `Apr 20 17:07` → `May 6 22:48` に更新、frontmatter は維持され body 部のみ書き換え |

## 3. Sveltia でなく Decap を採用した理由（重要）

最初は Sveltia CMS で立ち上げたが、ブラウザコンソールに以下の警告が出た：

> `local_backend` オプションは Sveltia CMS ではサポートされていません。このオプションは無視されます。
> https://sveltiacms.app/en/docs/migration/netlify-decap-cms#features-not-to-be-implemented

**Sveltia のローカル編集モードは File System Access API（FSA）ベース**で、ブラウザのディレクトリピッカーをユーザーが手動でクリックして対象ディレクトリを選ぶ仕様。decap-server プロキシは使わない。

このため、

- Playwright 自動検証では FSA のディレクトリピッカーが `Page.setInterceptFileChooserDialog()` で遮断され `AbortError` になる
- 本番運用では問題ないが、**「ローカル開発」のシナリオで決定的な摩擦がある**：すべての編集者がブラウザでフォルダ選択する手順を経る必要がある

そこで Decap CMS（Sveltia がフォークした元の Netlify CMS の後継）にピボット。Decap は `local_backend` を本来サポートし、HTTP プロキシ経由なのでヘッドレス自動化も自然に通る。**config.yml はバイト互換**なので、本番選定で Sveltia に戻したくなった場合も `<script src="...">` の URL 差し替えだけで済む。

## 4. 観測されたリスク・課題

### A. Rich Text モードが MDC ブロックを誤解釈する

Decap CMS のエディタは Rich Text / Markdown のトグルがあり、Rich Text モードでは
`::faq-section` を「`::faq-section` という見出し + `items:` という段落 + リスト」として解釈する。
このまま保存するとMDC構文が破壊される可能性が高い（今回は意図的に Markdown モードに切替えて保存）。

**含意**:
- 編集者には常に Markdown モードを使わせる必要があるか、Rich Text 化の前に MDC を専用ウィジェットに置換する必要がある
- Init Spec §7-B（スキーマ二重化）と密接：MDC コンポーネントを CMS 側のカスタムウィジェットとしてどう実装するかは別途検討
- 短期は「FAQ や ProductCard は管理者が Markdown モードで編集／編集者は本文のみ Rich Text」という運用ルールで回避可能

### B. `pageType: category` の `index.md` も記事一覧に紛れる

`folder: content/dog/daily` 配下にある `index.md`（カテゴリトップ用、`pageType: category`）がそのまま記事として一覧に出る。編集事故のリスクがあるため、

- collections を `pageType` でフィルタするか
- カテゴリ index 専用のコレクションを別に切るか

の判断が要る。Init Spec §7-B 配下に入れる課題。

### C. YAML フロースタイル → ブロックスタイル変換

`tags: [outing, odor]`（フロー）が保存後に `tags:\n  - outing\n  - odor`（ブロック）に書き換わる。
意味は同じだが、PetGurashi 既存記事すべてが書式変更されるので、初回保存だけ大量diffが出る。
一気に書式統一する PR を別途切る運用で吸収可能。

### D. 既存ポート競合

- 8081（decap-server デフォルト）→ Docker Desktop が常駐
- 3000（serve デフォルト）→ Chrome の何らかのプロセスが握っていた

PoC では 8082 / 3001 にずらして回避。本番では設定可能項目として明示すべき。

### E. 画像プレビュー 404

admin server (port 3001) は静的ファイルを `poc/sveltia/public/` から配信しているため、
`/images/articles/...` のパスで参照される PetGurashi のヒーロー画像が読めない。
プレビューだけの問題でファイル書き込み自体は影響なし。本番では admin と PetGurashi を統合配信するか、media path の rewrite が必要。

## 5. 検証で消去した事実（Spec §7-A の更新案）

| Spec の記述 | 検証で判明したこと |
|-----------|----------------|
| Sveltia: マルチリポ「△」 | ローカル編集は FSA 限定で、CI/automation との相性が悪い。OAuth デプロイ時の評価に集中すべき |
| Decap CMS: 候補表に明示なし（Sveltia の前身扱い） | local_backend が稼働するので **PoC 用ベースラインとして筆頭** に値する。本番採用候補としても再評価対象 |
| TinaCMS: 立ち上げ ~60 分 | 未検証（次フェーズに先送り） |
| Keystatic: シミュ用途には重め | 未検証（同上） |

## 6. 本番アーキテクチャへの示唆

ローカルでの動作と本番（編集者がリモートで触る）は前提が異なる：

- **ローカル**: admin + proxy + 対象リポ がすべて同一マシン → `local_backend` で OK
- **本番**: admin は Cloudflare Pages、編集対象は GitHub のリポ → `backend: github` + GitHub OAuth が必須

両モードを 1 つの config.yml で切替える慣用：

```yaml
backend:
  name: github
  repo: Yusaku0923/PetGurashi
  branch: main
local_backend: true   # 開発時のみ effective、本番では無視される
```

→ 編集者は本番で GitHub OAuth してログイン、開発者はローカル proxy で同じ admin を使える。
**この二重モードが Init Spec §3 の「編集者にも GitHub アカウントが必要」要件を裏付ける**。

## 7. 次にやるべきこと

1. **Init Spec §7-A の候補表を更新**（Decap を明示候補に追加、Sveltia は OAuth 用途で再評価）
2. **TinaCMS / Keystatic の同種PoC**（評価軸を揃えてから本番選定）— Spec の M2 配下
3. **MDCコンポーネントのカスタムウィジェット化** の方針決定（§4-A）
4. **マルチサイト対応の検証**: 今回は1サイトだけ。LicenseHub も同じ admin から編集できるかは config.yml に2つ目の collection group を足して別 PoC が必要
5. **本番デプロイ想定の OAuth 流路** を別 PoC で検証（GitHub OAuth App 作成 + Cloudflare Pages にデプロイ）

## 8. 起動・停止メモ

```bash
# proxy（PetGurashi で）
cd /Users/yusaku/projects/PetGurashi
PORT=8082 ALLOWED_HOSTS=http://localhost:3001 npx -y decap-server

# admin（blog-hub で別ターミナル）
cd /Users/yusaku/projects/blog-hub/poc/sveltia
npx -y serve public -l 3001

# ブラウザで http://localhost:3001/ を開いて Login

# 停止: 各ターミナルで Ctrl+C、もしくは
lsof -ti :8082 | xargs kill
lsof -ti :3001 | xargs kill
```
