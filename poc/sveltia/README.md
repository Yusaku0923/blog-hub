# Sveltia CMS PoC — blog-hub から PetGurashi の記事を編集できるか検証

## 目的

`docs/superpowers/specs/2026-05-06-init-design.md` §7-A の編集レイヤー候補のうち
**Sveltia CMS** を最初に検証する。「Hub から PetGurashi の content/ を編集できるか」
の最小ループを動かすことがゴール。

## 構成

```
[ブラウザ]
  ├─ http://localhost:3000/  ← Sveltia admin (この PoC ディレクトリを serve)
  │     └─ config.yml で local_backend: true
  └─ ↓ HTTP (port 8081, decap-server proxy)
[ファイルシステム]
  └─ /Users/yusaku/projects/PetGurashi/content/  ← 編集対象
```

## 起動手順

### 1. proxy サーバ（PetGurashi 側で実行）

デフォルトの 8081 はこの環境では Docker Desktop が握っているため、PORT を 8082 にずらす。
admin の origin (`http://localhost:3001`) を ALLOWED_HOSTS で明示する必要あり。

```bash
cd /Users/yusaku/projects/PetGurashi
PORT=8082 ALLOWED_HOSTS=http://localhost:3001 npx decap-server
```

### 2. admin の静的ホスト（blog-hub 側で実行）

`serve` のポート指定は `-l <port>`（`-p` ではない）。

```bash
cd /Users/yusaku/projects/blog-hub/poc/sveltia
npx serve public -l 3001
```

### 3. （任意）PetGurashi 開発サーバ

編集結果が即時反映されるか見たい場合のみ。

```bash
cd /Users/yusaku/projects/PetGurashi
pnpm dev   # http://localhost:8080
```

### 4. ブラウザで開く

`http://localhost:3001/` — Sveltia admin が起動し、`config.yml` で定義した
3コレクション（dog_daily / dog_starter / cat_daily）が表示される。

## 動作確認チェックリスト

- [ ] admin の UI がエラーなく表示される
- [ ] 3 つのコレクションが左ペインに見える
- [ ] dog_daily を開くと既存の `sample.md` がリストに出る
- [ ] sample.md を開くとフィールド（title, description, …, body）が正しく populate される
- [ ] body を 1 文字編集して保存 → ファイル mtime が更新される
- [ ] PetGurashi dev server を立てておけば、HMR で表示も更新される

## 既知の制約・スコープ外

- このPoCは **3 collections だけ** マッピング。残り（cat/* / dog/outing 等）は config.yml 追記で機械的に拡張可
- `@nuxt/content` v3 の zod 制約（title 10-40 等）は Sveltia 側では `hint` 表示のみ。
  違反値で保存すると Nuxt build 時に zod 例外が出る — これはスペック §7-B で扱う
- MDC コンポーネント（`::faq-section` 等）はマークダウン本文に手書きする必要あり。
  Sveltia は MDC を理解しない（Decap CMS 互換のためフラットな markdown widget）
- 画像は image widget 経由で `public/images/articles/` に配置される。
  WebP 自動変換などは含まれない（PetGurashi 側の `@nuxt/image` がビルド時に処理）

## 検証結果

`/Users/yusaku/projects/blog-hub/docs/poc/2026-05-06-sveltia-findings.md` を参照。
