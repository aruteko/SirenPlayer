# NOTICE

## 派生元のプロジェクト

Siren Player は，次のプロジェクトを基に開発した派生アプリケーションである．

- **BBMusica** — Copyright (c) 2026 aruteko
  <https://github.com/aruteko/BBMusica>
  ライセンス: MIT
- **BBPlayer** — Copyright (c) 2025 Roitium
  <https://github.com/bbplayer-app/BBPlayer>
  ライセンス: MIT

BBMusica は，BBPlayer を基にした派生アプリケーションである．
Siren Player の再生サービスと再生モジュールの設計は，BBPlayer の音声再生エンジン Orpheus に基づく．
プレーヤー画面の流れる背景 src/components/player/FluidBackground.tsx と，カバーから色を取り出すモジュール modules/image-theme-colors は，BBPlayer のコードを基にしている．
ビルド用のプラグインとスクリプトも，BBPlayer と BBMusica のものを基にしている．
MIT ライセンスの条件に従い，元の著作権表示およびライセンス全文を [LICENSE](./LICENSE) に保持している．

## 主な変更点

- Bilibili に関する機能をすべて除去．対象は，ログイン，検索，投稿者ページ，いいね，お気に入りやコレクションの同期，装扮，Cookie の扱い，Bilibili 用の URL 解決である．
- Monster Siren Records の公開 API から，アルバムと曲を取得して再生する構成に変更．
- 再生モジュールを新規に書き直し，アルバム単位のキュー，バックグラウンド再生，通知，ロック画面の操作に絞った．
- 歌詞は，曲ごとの LRC ファイルを取得して表示する．
- プレーヤー画面を BBMusica の構成に合わせ，MV を除いて再現した．背景は，カバーの色から作る流れる配色である．
- 検索，プレイリスト，曲のダウンロードを新規に実装．ダウンロードした曲は，アプリ専用の領域にだけ保存する．
- イコライザー，ステーション，履歴，バックアップ，コメント，MV は含めない．
- 表示言語は中国語．ソースの文言は日本語で書き，対応表で置き換える．
- アプリ名，パッケージ名，アイコン，署名鍵を独自のものに変更．パッケージ名は `com.aruteko.sirenplayer`．

## 権利と非公式であること

Siren Player は非公式のアプリケーションであり，塞壬唱片 Monster Siren Records および Hypergryph とは関係がない．
「明日方舟」「Arknights」「塞壬唱片」「Monster Siren Records」「Hypergryph」は，各権利者の商標または登録商標である．

曲の音源，歌詞，アルバムの画像の権利は，塞壬唱片および Hypergryph に帰属する．
本リポジトリは，それらを一切含まない．アプリは，公式サイトの公開 API から取得して再生し，ダウンロードは利用者の指示でのみ行う．
公開 API の仕様は，予告なく変更されることがある．

## 商標等

アイコンは，本プロジェクトのために新たに作成した図であり，上記の権利者のロゴや画像を使っていない．

## サードパーティ製ソフトウェア

Siren Player は，多数のオープンソースライブラリを使用している．各ライブラリのライセンスは，それぞれの配布物に含まれる．
