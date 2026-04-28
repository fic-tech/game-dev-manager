import type {
  ActivityEntry,
  Comment,
  Issue,
  Project,
  TimeEntry,
  User,
  WikiPage,
} from "./types";

const now = Date.now();
const day = 1000 * 60 * 60 * 24;

const iso = (offset: number) => new Date(now + offset).toISOString();
const date = (offset: number) =>
  new Date(now + offset).toISOString().slice(0, 10);

export const seedUsers: User[] = [
  {
    id: "u-1",
    name: "佐藤 美咲",
    email: "misaki.sato@example.com",
    avatarHue: 18,
    role: "manager",
  },
  {
    id: "u-2",
    name: "田中 啓介",
    email: "keisuke.tanaka@example.com",
    avatarHue: 198,
    role: "developer",
  },
  {
    id: "u-3",
    name: "鈴木 葵",
    email: "aoi.suzuki@example.com",
    avatarHue: 152,
    role: "developer",
  },
  {
    id: "u-4",
    name: "山田 涼介",
    email: "ryosuke.yamada@example.com",
    avatarHue: 268,
    role: "reporter",
  },
  {
    id: "u-5",
    name: "中村 千夏",
    email: "chinatsu.nakamura@example.com",
    avatarHue: 340,
    role: "developer",
  },
];

export const seedProjects: Project[] = [
  {
    id: "p-1",
    identifier: "atlas",
    name: "Atlas — 顧客向けポータル刷新",
    description:
      "既存の顧客ポータルをモダンなUIへ全面刷新。認証基盤の見直し・ダッシュボードの再設計・通知ハブの新設を含む。",
    color: "#6366f1",
    createdAt: iso(-day * 90),
    startDate: date(-day * 60),
    endDate: date(day * 90),
    memberIds: ["u-1", "u-2", "u-3", "u-5"],
  },
  {
    id: "p-2",
    identifier: "lumen",
    name: "Lumen — 社内ナレッジベース",
    description:
      "Slack・Confluence・Driveに分散した知識を一元化する社内検索ポータル。全文検索とAIサマリ機能を提供。",
    color: "#10b981",
    createdAt: iso(-day * 45),
    startDate: date(-day * 30),
    endDate: date(day * 60),
    memberIds: ["u-1", "u-3", "u-4"],
  },
  {
    id: "p-3",
    identifier: "nova",
    name: "Nova — モバイルアプリ刷新",
    description:
      "iOS / Android のネイティブアプリを React Native へ統合。リリースサイクルを2週間に短縮することを目標。",
    color: "#f97316",
    createdAt: iso(-day * 14),
    startDate: date(-day * 7),
    endDate: date(day * 120),
    memberIds: ["u-2", "u-4", "u-5"],
  },
];

export const seedIssues: Issue[] = [
  {
    id: "i-1",
    projectId: "p-1",
    number: 1,
    subject: "ログイン画面のレスポンシブ対応",
    description:
      "iPhone SE (375px) で入力欄が見切れる問題。フォームのレイアウトを再設計してください。",
    tracker: "bug",
    status: "in_progress",
    priority: "high",
    authorId: "u-1",
    assigneeId: "u-2",
    parentId: null,
    startDate: date(-day * 3),
    dueDate: date(day * 4),
    estimatedHours: 6,
    doneRatio: 60,
    tags: ["ui", "frontend"],
    createdAt: iso(-day * 4),
    updatedAt: iso(-day * 1),
  },
  {
    id: "i-2",
    projectId: "p-1",
    number: 2,
    subject: "ダッシュボードのウィジェット並び替え機能",
    description:
      "ドラッグ&ドロップでカードを並び替え、レイアウトを保存できるようにする。",
    tracker: "feature",
    status: "new",
    priority: "normal",
    authorId: "u-1",
    assigneeId: "u-3",
    parentId: null,
    startDate: date(-day * 1),
    dueDate: date(day * 14),
    estimatedHours: 18,
    doneRatio: 0,
    tags: ["dashboard", "UX"],
    createdAt: iso(-day * 2),
    updatedAt: iso(-day * 2),
  },
  {
    id: "i-3",
    projectId: "p-1",
    number: 3,
    subject: "OAuth プロバイダの追加 (Microsoft Entra ID)",
    description:
      "既存のGoogle / GitHubに加え、Microsoft Entra IDによるシングルサインオンに対応する。",
    tracker: "feature",
    status: "feedback",
    priority: "high",
    authorId: "u-3",
    assigneeId: "u-2",
    parentId: null,
    startDate: date(-day * 7),
    dueDate: date(day * 7),
    estimatedHours: 12,
    doneRatio: 80,
    tags: ["auth", "backend"],
    createdAt: iso(-day * 8),
    updatedAt: iso(-day * 0.5),
  },
  {
    id: "i-4",
    projectId: "p-1",
    number: 4,
    subject: "通知センターの再設計",
    description:
      "ベルアイコンから一覧を表示するパネル。既読・未読の管理、種別フィルタリングを実装する。",
    tracker: "feature",
    status: "new",
    priority: "normal",
    authorId: "u-1",
    assigneeId: "u-5",
    parentId: null,
    startDate: date(day * 3),
    dueDate: date(day * 21),
    estimatedHours: 24,
    doneRatio: 0,
    tags: ["notifications"],
    createdAt: iso(-day * 1),
    updatedAt: iso(-day * 1),
  },
  {
    id: "i-5",
    projectId: "p-1",
    number: 5,
    subject: "二要素認証のフロー改善",
    description:
      "リカバリコードの自動生成・QRコード表示・バックアップ用のメール送信を行う。",
    tracker: "task",
    status: "resolved",
    priority: "urgent",
    authorId: "u-2",
    assigneeId: "u-2",
    parentId: null,
    startDate: date(-day * 14),
    dueDate: date(-day * 2),
    estimatedHours: 8,
    doneRatio: 100,
    tags: ["security", "auth"],
    createdAt: iso(-day * 16),
    updatedAt: iso(-day * 2),
  },
  {
    id: "i-6",
    projectId: "p-2",
    number: 1,
    subject: "全文検索インデックスの設計",
    description:
      "OpenSearch / Meilisearch / Algolia の比較。日次の差分更新が現実的に行えること。",
    tracker: "task",
    status: "in_progress",
    priority: "high",
    authorId: "u-1",
    assigneeId: "u-3",
    parentId: null,
    startDate: date(-day * 5),
    dueDate: date(day * 9),
    estimatedHours: 16,
    doneRatio: 35,
    tags: ["search", "infra"],
    createdAt: iso(-day * 6),
    updatedAt: iso(-day * 1),
  },
  {
    id: "i-7",
    projectId: "p-2",
    number: 2,
    subject: "AIサマリ機能のプロンプト設計",
    description:
      "GPT-4o によるドキュメント要約。出典リンクの自動付与とフィードバック収集を含む。",
    tracker: "feature",
    status: "new",
    priority: "normal",
    authorId: "u-3",
    assigneeId: null,
    parentId: null,
    startDate: date(day * 5),
    dueDate: date(day * 30),
    estimatedHours: 20,
    doneRatio: 0,
    tags: ["ai", "ux"],
    createdAt: iso(-day * 0.5),
    updatedAt: iso(-day * 0.5),
  },
  {
    id: "i-8",
    projectId: "p-2",
    number: 3,
    subject: "Slack / Drive コネクタ実装",
    description: "OAuthフロー、定期同期ジョブ、レート制御の対応。",
    tracker: "feature",
    status: "in_progress",
    priority: "high",
    authorId: "u-1",
    assigneeId: "u-4",
    parentId: null,
    startDate: date(-day * 8),
    dueDate: date(day * 10),
    estimatedHours: 32,
    doneRatio: 45,
    tags: ["integration"],
    createdAt: iso(-day * 9),
    updatedAt: iso(-day * 0.5),
  },
  {
    id: "i-9",
    projectId: "p-3",
    number: 1,
    subject: "React Native プロジェクトの初期化",
    description: "Expo SDK 52、TypeScript、ESLint、Prettier のセットアップ。",
    tracker: "task",
    status: "closed",
    priority: "normal",
    authorId: "u-2",
    assigneeId: "u-2",
    parentId: null,
    startDate: date(-day * 5),
    dueDate: date(-day * 3),
    estimatedHours: 4,
    doneRatio: 100,
    tags: ["setup"],
    createdAt: iso(-day * 6),
    updatedAt: iso(-day * 3),
  },
  {
    id: "i-10",
    projectId: "p-3",
    number: 2,
    subject: "プッシュ通知の認証フロー",
    description:
      "FCM / APNs のトークン取得・サーバ登録・トピック購読までの一連の流れを実装する。",
    tracker: "feature",
    status: "in_progress",
    priority: "high",
    authorId: "u-2",
    assigneeId: "u-5",
    parentId: null,
    startDate: date(-day * 2),
    dueDate: date(day * 12),
    estimatedHours: 14,
    doneRatio: 25,
    tags: ["push", "mobile"],
    createdAt: iso(-day * 3),
    updatedAt: iso(-day * 1),
  },
  {
    id: "i-11",
    projectId: "p-3",
    number: 3,
    subject: "デザインシステムの統合",
    description: "Figma の Design Token を React Native コンポーネントに反映。",
    tracker: "task",
    status: "new",
    priority: "normal",
    authorId: "u-4",
    assigneeId: "u-4",
    parentId: null,
    startDate: date(day * 7),
    dueDate: date(day * 28),
    estimatedHours: 24,
    doneRatio: 0,
    tags: ["design-system"],
    createdAt: iso(-day * 0.2),
    updatedAt: iso(-day * 0.2),
  },
  {
    id: "i-12",
    projectId: "p-1",
    number: 6,
    subject: "アクセス解析イベントの整理",
    description:
      "Mixpanel に送るイベント名・プロパティの命名規則を統一する。",
    tracker: "support",
    status: "new",
    priority: "low",
    authorId: "u-5",
    assigneeId: null,
    parentId: null,
    dueDate: date(day * 30),
    estimatedHours: 6,
    doneRatio: 0,
    tags: ["analytics"],
    createdAt: iso(-day * 0.1),
    updatedAt: iso(-day * 0.1),
  },
];

export const seedComments: Comment[] = [
  {
    id: "c-1",
    issueId: "i-1",
    authorId: "u-2",
    body: "iPhone SE 実機で確認しました。フォームのpaddingを24pxに調整中です。",
    createdAt: iso(-day * 1),
  },
  {
    id: "c-2",
    issueId: "i-1",
    authorId: "u-1",
    body: "PRが上がったらレビューします!",
    createdAt: iso(-day * 0.5),
  },
  {
    id: "c-3",
    issueId: "i-3",
    authorId: "u-2",
    body: "Entra IDのテナントIDをどう持たせるか相談したいです。",
    createdAt: iso(-day * 1.5),
  },
  {
    id: "c-4",
    issueId: "i-3",
    authorId: "u-3",
    body: "プロジェクト単位のmetaフィールドに保存する案で進めましょう。",
    createdAt: iso(-day * 0.5),
  },
  {
    id: "c-5",
    issueId: "i-6",
    authorId: "u-3",
    body: "Meilisearchで POC 中。日本語の Tokenize は要追加検証。",
    createdAt: iso(-day * 1),
  },
];

export const seedActivities: ActivityEntry[] = [
  {
    id: "a-1",
    type: "issue_created",
    actorId: "u-5",
    projectId: "p-1",
    issueId: "i-12",
    message: "「アクセス解析イベントの整理」を作成しました",
    createdAt: iso(-day * 0.1),
  },
  {
    id: "a-2",
    type: "comment_added",
    actorId: "u-3",
    projectId: "p-1",
    issueId: "i-3",
    message: "「OAuthプロバイダの追加」にコメントしました",
    createdAt: iso(-day * 0.5),
  },
  {
    id: "a-3",
    type: "issue_updated",
    actorId: "u-2",
    projectId: "p-1",
    issueId: "i-1",
    message: "進捗を 60% に更新しました",
    createdAt: iso(-day * 1),
  },
  {
    id: "a-4",
    type: "issue_closed",
    actorId: "u-2",
    projectId: "p-1",
    issueId: "i-5",
    message: "「二要素認証のフロー改善」を解決にしました",
    createdAt: iso(-day * 2),
  },
  {
    id: "a-5",
    type: "issue_closed",
    actorId: "u-2",
    projectId: "p-3",
    issueId: "i-9",
    message: "「React Native プロジェクトの初期化」を完了しました",
    createdAt: iso(-day * 3),
  },
  {
    id: "a-6",
    type: "issue_created",
    actorId: "u-3",
    projectId: "p-2",
    issueId: "i-7",
    message: "「AIサマリ機能のプロンプト設計」を作成しました",
    createdAt: iso(-day * 0.5),
  },
];

export const seedWikiPages: WikiPage[] = [
  {
    id: "w-1",
    projectId: "p-1",
    slug: "home",
    title: "Atlas プロジェクト Wiki",
    body: `# Atlas プロジェクト Wiki

## 目的
顧客向けポータルを刷新し、認証・ダッシュボード・通知体験を改善する。

## マイルストーン
- M1: 認証基盤刷新 (~Q2)
- M2: ダッシュボード再設計 (~Q3)
- M3: 通知ハブ (~Q4)

## ステークホルダー
- PM: 佐藤 美咲
- Tech Lead: 田中 啓介
- Designer: 鈴木 葵`,
    updatedAt: iso(-day * 7),
    authorId: "u-1",
  },
  {
    id: "w-2",
    projectId: "p-2",
    slug: "home",
    title: "Lumen ナレッジベース",
    body: `# Lumen — 社内ナレッジベース

## ビジョン
> 「探す」を 0 にする。

## アーキテクチャ
- Frontend: Next.js
- Search: Meilisearch
- Connectors: Slack / Drive / Notion

## オーナー
- @aoi.suzuki`,
    updatedAt: iso(-day * 3),
    authorId: "u-3",
  },
];

export const seedTimeEntries: TimeEntry[] = [
  {
    id: "t-1",
    issueId: "i-1",
    userId: "u-2",
    hours: 3.5,
    note: "レイアウト調整",
    spentOn: date(-day * 1),
    createdAt: iso(-day * 1),
  },
  {
    id: "t-2",
    issueId: "i-3",
    userId: "u-2",
    hours: 4,
    note: "Entra IDの調査",
    spentOn: date(-day * 2),
    createdAt: iso(-day * 2),
  },
  {
    id: "t-3",
    issueId: "i-5",
    userId: "u-2",
    hours: 6,
    note: "リカバリコード生成 + QRコード",
    spentOn: date(-day * 3),
    createdAt: iso(-day * 3),
  },
];
