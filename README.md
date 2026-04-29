# Forge — 遊技機 演出開発ワークスペース

パチンコ・パチスロの演出制作を一元管理する、機種・工程ベースの開発ツールです。
Next.js 16 (App Router) + SQLite (better-sqlite3) + Drizzle ORM + Server Actions で構築されています。

## 初回セットアップ

```bash
# 1. 依存パッケージをインストール
npm install

# 2. SQLite DB を作成 (data/redmine.db)
npm run db:migrate

# 3. シードデータを投入 (機種・演出・ユーザー10名)
npm run db:seed
```

シード後の初期ログイン情報:

| メール | パスワード | 役割 |
|---|---|---|
| `admin@example.com` | `admin` | 管理者 |
| `tsuji@example.com` 他8名 | `password` | シードユーザー (各々 設定 → パスワード変更で変更可) |

## 開発

```bash
npm run dev
```

http://localhost:3000 を開く。

## 本番起動 (社内共有PCでの運用)

```bash
npm run build      # ビルド (1回でよい、コード更新時に再実行)
npm run start      # next start (ポート 3000)
```

社内 LAN 内の他PCからアクセスする場合:

1. **Windows ファイアウォール** で 3000/tcp を開放
   ```powershell
   New-NetFirewallRule -DisplayName "Forge 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
   ```
2. 共有PCのIPアドレスをメンバーに共有 (`ipconfig` で確認)
3. メンバーは `http://<IP>:3000` でアクセス

### 自動起動 (タスクスケジューラ)

PC再起動後も自動で起動するには、**Windows タスクスケジューラ** で「ログオン時」or「システム起動時」トリガで `npm run start` を起動するタスクを作成 (Working Directory を `D:\project\redmine` に設定)。

## バックアップ

DB はファイル1つ (`data/redmine.db`) なので、ファイルコピーでバックアップできます。

```powershell
# 簡易バックアップ例 (タスクスケジューラで日次実行を推奨)
$ts = Get-Date -Format "yyyyMMdd-HHmmss"
Copy-Item D:\project\redmine\data\redmine.db D:\backup\redmine-$ts.db
```

WAL モードを使っているため、コピーは稼働中でも問題ありません。

## DB 操作 (npm scripts)

| コマンド | 用途 |
|---|---|
| `npm run db:generate` | スキーマ変更後、マイグレーション SQL を生成 (`drizzle/`) |
| `npm run db:migrate` | 未適用のマイグレーションを DB に適用 |
| `npm run db:seed` | DB を空にしてシードデータを投入 |
| `npm run db:reset` | DB ファイルを削除 (要 `db:migrate` & `db:seed` で再作成) |

## アーキテクチャ概要

```
src/
├── lib/
│   ├── db/
│   │   ├── schema.ts        # Drizzle スキーマ定義
│   │   ├── client.ts        # better-sqlite3 + drizzle (singleton, server-only)
│   │   ├── migrate.ts       # npm run db:migrate
│   │   ├── seed.ts          # npm run db:seed
│   │   └── reset.ts         # npm run db:reset
│   ├── auth/
│   │   ├── password.ts      # bcryptjs
│   │   └── session.ts       # Cookie + DB sessions
│   ├── actions/             # 全 Server Actions (revalidatePath で再検証)
│   ├── queries/             # Server Components 用の読取専用関数
│   ├── types.ts             # ドメイン型 (DB と同期)
│   ├── labels.ts            # 列挙値の表示ラベル
│   └── pachinko-seed.ts     # 機種・演出のシードデータ
├── proxy.ts                 # 認証ガード (旧 middleware)
└── app/
    ├── layout.tsx           # 最小ルートレイアウト
    ├── login/               # 公開ページ (ログイン)
    └── (app)/               # 認証必須ルートグループ
        ├── layout.tsx       # AppShell + WorkspaceProvider
        ├── page.tsx         # ダッシュボード
        ├── machines/...
        ├── productions/...
        ├── assets/...
        ├── members/...
        └── settings/...
```

データの流れ:

```
[Server Component (page.tsx)]
   ↓ getWorkspaceData() で DB から取得 (lib/queries/workspace.ts)
   ↓
[(app)/layout.tsx → WorkspaceProvider]
   ↓ React Context で全データを配信
   ↓
[Client Components (各ページ)]
   ↓ useWorkspace() で参照
   ↓ 書込みは Server Actions (lib/actions/*) を直接 import
   ↓ 内部で revalidatePath('/', 'layout') → サーバから再取得
```

## 主要技術

- **Next.js 16.2.4** (App Router, Server Actions, Turbopack)
- **better-sqlite3** + **Drizzle ORM** — 単一ファイルDB、WALモード
- **bcryptjs** — パスワードハッシュ (純JS、ネイティブビルド不要)
- **DB セッション + httpOnly Cookie** — シンプルな認証 (NextAuth 不使用)
- **shadcn/ui** + **Tailwind CSS v4** — UI

## 注意

- `data/redmine.db` は `.gitignore` 済み — 本データを git にコミットしないこと
- 全 Server Action 内で `requireUser()` を呼んで認証必須化
- 編集者は `activities` テーブルに `actorId` として記録 (誰が何をしたか追跡可能)
- アクティビティは最新 200 件のみ保持 (古いものは自動削除)
