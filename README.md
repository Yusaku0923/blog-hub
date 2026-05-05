# blog-hub

複数のブログサイト（PetGurashi, LicenseHub, 他）を非エンジニアでも編集・分析できるよう、1つのGUIから統括するハブツール。

## ステータス

初期設計フェーズ。仕様は [`docs/superpowers/specs/2026-05-06-init-design.md`](docs/superpowers/specs/2026-05-06-init-design.md) を参照。

## 設計方針（要約）

- **対象**: Nuxt 3 + `@nuxt/content` + Cloudflare Pages 構成のブログ群
- **編集レイヤー**: マルチリポ対応の既製 CMS を採用（Pages CMS / Sveltia / Keystatic / TinaCMS から PoC で選定）
- **分析パネル**: GA4 + GSC API を呼ぶ薄い独自ダッシュボードを上乗せ
- **非対象**: KW調査・画像取得などの自動化パイプラインは Claude Code 側に残す

詳細は仕様書を参照のこと。
