import type {
  Asset,
  LampCue,
  Machine,
  Phase,
  PhaseState,
  PhaseType,
  Production,
  SoundCue,
  StoryboardScene,
  User,
  VideoTask,
} from "./types";
import { PHASE_DEPENDENCIES, PHASE_ORDER } from "./labels";

const day = 1000 * 60 * 60 * 24;
const now = Date.now();
const iso = (offset: number) => new Date(now + offset).toISOString();
const date = (offset: number) =>
  new Date(now + offset).toISOString().slice(0, 10);

export const pachinkoUsers: User[] = [
  {
    id: "pu-dir1",
    name: "辻 雅彦",
    email: "tsuji@example.com",
    avatarHue: 35,
    role: "manager",
    discipline: "director",
  },
  {
    id: "pu-des1",
    name: "高橋 莉子",
    email: "takahashi@example.com",
    avatarHue: 280,
    role: "developer",
    discipline: "designer",
  },
  {
    id: "pu-des2",
    name: "森田 拓海",
    email: "morita@example.com",
    avatarHue: 305,
    role: "developer",
    discipline: "designer",
  },
  {
    id: "pu-vid1",
    name: "藤本 玲奈",
    email: "fujimoto@example.com",
    avatarHue: 188,
    role: "developer",
    discipline: "video",
  },
  {
    id: "pu-vid2",
    name: "村上 賢",
    email: "murakami@example.com",
    avatarHue: 200,
    role: "developer",
    discipline: "video",
  },
  {
    id: "pu-snd1",
    name: "西野 葉月",
    email: "nishino@example.com",
    avatarHue: 332,
    role: "developer",
    discipline: "sound",
  },
  {
    id: "pu-snd2",
    name: "大島 健",
    email: "oshima@example.com",
    avatarHue: 350,
    role: "developer",
    discipline: "sound",
  },
  {
    id: "pu-lmp1",
    name: "上田 怜",
    email: "ueda@example.com",
    avatarHue: 50,
    role: "developer",
    discipline: "lamp",
  },
  {
    id: "pu-qa1",
    name: "三浦 彩",
    email: "miura@example.com",
    avatarHue: 140,
    role: "reporter",
    discipline: "qa",
  },
];

export const pachinkoMachines: Machine[] = [
  {
    id: "m-ncm",
    code: "P-NCM",
    name: "Pネオ・コスモス〜銀河の覇者〜",
    series: "ネオ・コスモスシリーズ",
    description:
      "宇宙SFをモチーフにした最新機。新機構「コスモビーム液晶」を搭載。",
    color: "#6366f1",
    releaseTarget: "2027-06",
    memberIds: [
      "pu-dir1",
      "pu-des1",
      "pu-des2",
      "pu-vid1",
      "pu-snd1",
      "pu-lmp1",
      "pu-qa1",
    ],
    createdAt: iso(-day * 120),
  },
  {
    id: "m-sk",
    code: "P-SK",
    name: "Pスーパーカイバー リローデッド",
    series: "カイバーシリーズ",
    description:
      "ロボットアクション。前作からの継承演出と、完全新規スーパーリーチ群。",
    color: "#ef4444",
    releaseTarget: "2027-09",
    memberIds: [
      "pu-dir1",
      "pu-des2",
      "pu-vid2",
      "pu-snd2",
      "pu-lmp1",
      "pu-qa1",
    ],
    createdAt: iso(-day * 80),
  },
  {
    id: "m-sg",
    code: "P-SG",
    name: "Pストレイ・ガーデン",
    series: "ガーデンシリーズ",
    description:
      "ファンタジー世界を舞台にした和風×幻想テーマ。新規IPの第一作。",
    color: "#10b981",
    releaseTarget: "2027-12",
    memberIds: ["pu-dir1", "pu-des1", "pu-vid1", "pu-snd1", "pu-lmp1"],
    createdAt: iso(-day * 30),
  },
];

interface ProductionInput {
  id: string;
  machineId: string;
  code: string;
  name: string;
  category: Production["category"];
  description: string;
  durationSec: number;
  priority: Production["priority"];
  ownerId: string;
  state: Production["state"];
  targetDate?: string;
  /** 各 phase の状態。指定しなかったものは依存関係から自動算出 */
  phaseStates: Partial<Record<PhaseType, PhaseState>>;
  phaseAssignees: Partial<Record<PhaseType, string>>;
  scenes: Array<{
    title: string;
    description: string;
    videoNote: string;
    soundNote: string;
    lampNote: string;
    startSec: number;
    endSec: number;
    state?: "draft" | "fixed";
  }>;
  assets: Array<{
    category: Asset["category"];
    name: string;
    fileLabel: string;
    authorId: string;
    state: Asset["state"];
    version: number;
    dataKind?: Asset["dataKind"];
    revisionImpact?: Asset["revisionImpact"];
    finalDueDays?: number;
    finalReceivedDays?: number;
    reworkRequired?: boolean;
    reworkDoneDays?: number;
  }>;
  soundCues: Array<{
    type: SoundCue["type"];
    name: string;
    state: SoundCue["state"];
    assigneeId: string | null;
    note: string;
  }>;
  lampCues: Array<{
    name: string;
    pattern: string;
    colors: string[];
    state: LampCue["state"];
    assigneeId: string | null;
    note: string;
  }>;
}

const PRODUCTION_INPUT: ProductionInput[] = [
  {
    id: "pr-ncm-001",
    machineId: "m-ncm",
    code: "NCM-PV-001",
    name: "コスモ予告 (恒星出現)",
    category: "preview",
    description:
      "通常時に発生する強予告。中央液晶に巨大な恒星が出現し、後続演出への期待感を煽る。",
    durationSec: 6.5,
    priority: "high",
    ownerId: "pu-dir1",
    state: "in_progress",
    targetDate: date(day * 14),
    phaseStates: {
      vcon: "done",
      asset: "done",
      video: "in_progress",
      sound_compose: "review",
      sound_impl: "todo",
      lamp: "todo",
      review: "todo",
    },
    phaseAssignees: {
      vcon: "pu-des1",
      asset: "pu-des2",
      video: "pu-vid1",
      sound_compose: "pu-snd1",
      sound_impl: "pu-snd1",
      lamp: "pu-lmp1",
      review: "pu-dir1",
    },
    scenes: [
      {
        title: "S1: 暗転",
        description: "全体暗転。星が一点に集束する",
        videoNote: "BG暗転 → パーティクル収束 (0.0–1.5s)",
        soundNote: "サブベース、リバース系SE",
        lampNote: "全消灯 → 中央のみ淡い青",
        startSec: 0,
        endSec: 1.5,
        state: "fixed",
      },
      {
        title: "S2: 恒星出現",
        description: "中央に巨大な恒星が出現、画面全体を白く照らす",
        videoNote: "恒星モデル拡大 (1.5–3.5s)、ブルーム強",
        soundNote: "炸裂SE + 弦楽スティング",
        lampNote: "全ランプ白フラッシュ → ホワイトアウト",
        startSec: 1.5,
        endSec: 3.5,
        state: "fixed",
      },
      {
        title: "S3: 銀河展開",
        description: "恒星が後退し、背景に広大な銀河が展開",
        videoNote: "カメラドリーアウト、星雲レイヤー(1〜3)",
        soundNote: "BGM クロスフェード、コーラスIN",
        lampNote: "周辺LED 紫→青のグラデーション",
        startSec: 3.5,
        endSec: 6.5,
        state: "draft",
      },
    ],
    assets: [
      {
        category: "background",
        name: "深宇宙_メイン",
        fileLabel: "BG_NCM_DEEP_01.psd",
        authorId: "pu-des2",
        state: "approved",
        version: 4,
        dataKind: "final",
        revisionImpact: "swap",
        finalReceivedDays: -5,
      },
      {
        category: "effect",
        name: "恒星パーティクル",
        fileLabel: "FX_NCM_STAR_01.json",
        authorId: "pu-des1",
        state: "approved",
        version: 6,
        dataKind: "final",
        revisionImpact: "rework",
        finalReceivedDays: -2,
        reworkRequired: true,
      },
      {
        category: "effect",
        name: "ホワイトアウト",
        fileLabel: "FX_NCM_FLASH_01.exr",
        authorId: "pu-des2",
        state: "review",
        version: 2,
        dataKind: "temp",
        revisionImpact: "unknown",
        finalDueDays: 5,
      },
      {
        category: "bgm",
        name: "予告_期待煽り",
        fileLabel: "BGM_NCM_PV_HOPE.wav",
        authorId: "pu-snd1",
        state: "review",
        version: 3,
        dataKind: "temp",
        revisionImpact: "swap",
        finalDueDays: 3,
      },
      {
        category: "se",
        name: "恒星炸裂SE",
        fileLabel: "SE_NCM_STARBURST.wav",
        authorId: "pu-snd1",
        state: "approved",
        version: 2,
        dataKind: "final",
        revisionImpact: "swap",
        finalReceivedDays: -8,
      },
    ],
    soundCues: [
      {
        type: "bgm",
        name: "予告_期待煽り",
        state: "review",
        assigneeId: "pu-snd1",
        note: "クロスフェード4秒。テンポは120BPM想定。",
      },
      {
        type: "se",
        name: "恒星炸裂SE",
        state: "approved",
        assigneeId: "pu-snd1",
        note: "S2 1.6秒目で再生開始",
      },
    ],
    lampCues: [
      {
        name: "中央フォーカス",
        pattern: "fade-in 1.5s",
        colors: ["#1e90ff", "#3b82f6"],
        state: "wip",
        assigneeId: "pu-lmp1",
        note: "S1で中央の単色フェード",
      },
      {
        name: "ホワイトフラッシュ",
        pattern: "flash x3",
        colors: ["#ffffff"],
        state: "wip",
        assigneeId: "pu-lmp1",
        note: "S2 で恒星出現と完全同期",
      },
    ],
  },
  {
    id: "pr-ncm-002",
    machineId: "m-ncm",
    code: "NCM-SR-002",
    name: "銀河大決戦 (スーパーリーチ)",
    category: "super_reach",
    description:
      "本機メインのスーパーリーチ。3DCG とライブ映像のハイブリッド。",
    durationSec: 47.0,
    priority: "critical",
    ownerId: "pu-dir1",
    state: "in_progress",
    targetDate: date(day * 30),
    phaseStates: {
      vcon: "done",
      asset: "in_progress",
      video: "todo",
      sound_compose: "in_progress",
      sound_impl: "todo",
      lamp: "todo",
      review: "todo",
    },
    phaseAssignees: {
      vcon: "pu-des1",
      asset: "pu-des2",
      video: "pu-vid1",
      sound_compose: "pu-snd1",
      sound_impl: "pu-snd1",
      lamp: "pu-lmp1",
      review: "pu-dir1",
    },
    scenes: [
      {
        title: "S1: 出撃シーケンス",
        description: "母艦から艦隊が出撃する導入カット",
        videoNote: "3D艦隊シーン、カメラパン10秒",
        soundNote: "金属音 → ストリングス導入",
        lampNote: "段階的に明度UP、青基調",
      startSec: 0,
        endSec: 10,
      },
      {
        title: "S2: 戦闘 (前半)",
        description: "敵艦隊との交戦シーン",
        videoNote: "高速カット割り、爆発エフェクト多用",
        soundNote: "テンポ160のオーケストラ、ヒットSE",
        lampNote: "赤白フラッシュ連打",
        startSec: 10,
        endSec: 24,
      },
      {
        title: "S3: 撃墜 → 主人公機登場",
        description: "ピンチで主人公機が登場、必殺技チャージ",
        videoNote: "スローモーション、レンズフレア",
        soundNote: "ボーカルテーマIN、コーラス",
        lampNote: "ゴールド+ホワイト、流星パターン",
        startSec: 24,
        endSec: 36,
      },
      {
        title: "S4: 必殺技 → 結果",
        description: "必殺技発動、結果カット",
        videoNote: "光線爆発、衝撃波 → 当落表示",
        soundNote: "炸裂、シンバル、結果ジングル",
        lampNote: "全光フラッシュ、虹色レインボー",
        startSec: 36,
        endSec: 47,
      },
    ],
    assets: [
      {
        category: "character",
        name: "主人公機モデル",
        fileLabel: "CH_NCM_HERO_v3.fbx",
        authorId: "pu-des1",
        state: "review",
        version: 3,
        dataKind: "temp",
        revisionImpact: "rework",
        finalDueDays: 10,
      },
      {
        category: "character",
        name: "敵艦隊_中ボス",
        fileLabel: "CH_NCM_ENEMY_v2.fbx",
        authorId: "pu-des2",
        state: "wip",
        version: 2,
        dataKind: "temp",
        revisionImpact: "unknown",
        finalDueDays: 14,
      },
      {
        category: "background",
        name: "宇宙戦場_前景",
        fileLabel: "BG_NCM_BATTLE_FRONT.psd",
        authorId: "pu-des2",
        state: "wip",
        version: 1,
        dataKind: "temp",
        revisionImpact: "swap",
        finalDueDays: 7,
      },
      {
        category: "effect",
        name: "光線爆発",
        fileLabel: "FX_NCM_BEAM_BURST.json",
        authorId: "pu-des1",
        state: "wip",
        version: 1,
        dataKind: "temp",
        revisionImpact: "unknown",
      },
      {
        category: "bgm",
        name: "決戦テーマ",
        fileLabel: "BGM_NCM_BATTLE_THEME.wav",
        authorId: "pu-snd1",
        state: "wip",
        version: 1,
        dataKind: "temp",
        revisionImpact: "unknown",
        finalDueDays: 21,
      },
    ],
    soundCues: [
      {
        type: "bgm",
        name: "決戦テーマ",
        state: "wip",
        assigneeId: "pu-snd1",
        note: "オーケストラ + コーラス。47秒で完結する構成",
      },
      {
        type: "voice",
        name: "主人公機 出撃ボイス",
        state: "wip",
        assigneeId: "pu-snd1",
        note: "S3冒頭で再生",
      },
    ],
    lampCues: [
      {
        name: "戦闘フラッシュ",
        pattern: "flash random 0.2s",
        colors: ["#ef4444", "#ffffff"],
        state: "wip",
        assigneeId: "pu-lmp1",
        note: "S2全期間で連打",
      },
    ],
  },
  {
    id: "pr-ncm-003",
    machineId: "m-ncm",
    code: "NCM-FA-003",
    name: "大当りファンファーレ",
    category: "fanfare",
    description:
      "大当り確定時の祝祭演出。3秒間で爆発的な高揚感を作る。",
    durationSec: 3.2,
    priority: "high",
    ownerId: "pu-dir1",
    state: "review",
    targetDate: date(day * 7),
    phaseStates: {
      vcon: "done",
      asset: "done",
      video: "done",
      sound_compose: "done",
      sound_impl: "done",
      lamp: "review",
      review: "todo",
    },
    phaseAssignees: {
      vcon: "pu-des1",
      asset: "pu-des2",
      video: "pu-vid1",
      sound_compose: "pu-snd1",
      sound_impl: "pu-snd1",
      lamp: "pu-lmp1",
      review: "pu-dir1",
    },
    scenes: [
      {
        title: "S1: 祝祭",
        description: "クラッカー演出 + 大当り表示",
        videoNote: "粒子爆発、ロゴアニメ",
        soundNote: "ファンファーレ + 拍手",
        lampNote: "全ランプ虹色レインボー、3周期",
        startSec: 0,
        endSec: 3.2,
        state: "fixed",
      },
    ],
    assets: [
      {
        category: "logo",
        name: "大当りロゴ",
        fileLabel: "LO_NCM_BONUS_01.ai",
        authorId: "pu-des1",
        state: "approved",
        version: 5,
        dataKind: "final",
        revisionImpact: "swap",
        finalReceivedDays: -10,
      },
      {
        category: "effect",
        name: "粒子爆発",
        fileLabel: "FX_NCM_CONFETTI.json",
        authorId: "pu-des2",
        state: "approved",
        version: 3,
        dataKind: "final",
        revisionImpact: "swap",
        finalReceivedDays: -7,
      },
      {
        category: "se",
        name: "ファンファーレジングル",
        fileLabel: "BGM_NCM_FANFARE.wav",
        authorId: "pu-snd1",
        state: "approved",
        version: 4,
        dataKind: "final",
        revisionImpact: "swap",
        finalReceivedDays: -12,
      },
    ],
    soundCues: [
      {
        type: "bgm",
        name: "ファンファーレ",
        state: "approved",
        assigneeId: "pu-snd1",
        note: "リードトランペット + コーラス",
      },
    ],
    lampCues: [
      {
        name: "祝祭レインボー",
        pattern: "rainbow loop 1s",
        colors: ["#ff0000", "#ff8000", "#ffff00", "#00ff00", "#0080ff", "#8000ff"],
        state: "review",
        assigneeId: "pu-lmp1",
        note: "再生時間に合わせて3周",
      },
    ],
  },
  {
    id: "pr-ncm-004",
    machineId: "m-ncm",
    code: "NCM-GE-004",
    name: "通常変動 (短)",
    category: "general",
    description: "ベース変動。3秒程度のシンプル演出。",
    durationSec: 3.0,
    priority: "normal",
    ownerId: "pu-dir1",
    state: "completed",
    phaseStates: {
      vcon: "done",
      asset: "done",
      video: "done",
      sound_compose: "done",
      sound_impl: "done",
      lamp: "done",
      review: "done",
    },
    phaseAssignees: {
      vcon: "pu-des1",
      asset: "pu-des1",
      video: "pu-vid1",
      sound_compose: "pu-snd1",
      sound_impl: "pu-snd1",
      lamp: "pu-lmp1",
      review: "pu-dir1",
    },
    scenes: [
      {
        title: "S1: 図柄回転",
        description: "通常の図柄回転 (左→中→右)",
        videoNote: "図柄回転 1.0s × 3",
        soundNote: "ベース変動SE",
        lampNote: "ベース呼吸ゆらぎ",
        startSec: 0,
        endSec: 3.0,
        state: "fixed",
      },
    ],
    assets: [
      {
        category: "ui",
        name: "図柄1〜9",
        fileLabel: "UI_NCM_DIGIT_SET.psd",
        authorId: "pu-des1",
        state: "approved",
        version: 2,
        dataKind: "final",
        revisionImpact: "swap",
        finalReceivedDays: -20,
      },
    ],
    soundCues: [
      {
        type: "se",
        name: "図柄停止音",
        state: "approved",
        assigneeId: "pu-snd1",
        note: "停止のたびに再生",
      },
    ],
    lampCues: [
      {
        name: "ベース呼吸",
        pattern: "breath 3s",
        colors: ["#3b82f6"],
        state: "approved",
        assigneeId: "pu-lmp1",
        note: "通常時のアイドル",
      },
    ],
  },
  // ===== Pスーパーカイバー =====
  {
    id: "pr-sk-001",
    machineId: "m-sk",
    code: "SK-SR-001",
    name: "ロボ覚醒スーパーリーチ",
    category: "super_reach",
    description: "巨大ロボ「カイバー」の覚醒シーン。完全新規。",
    durationSec: 38.0,
    priority: "critical",
    ownerId: "pu-dir1",
    state: "in_progress",
    targetDate: date(day * 21),
    phaseStates: {
      vcon: "done",
      asset: "in_progress",
      video: "todo",
      sound_compose: "in_progress",
      sound_impl: "todo",
      lamp: "todo",
      review: "todo",
    },
    phaseAssignees: {
      vcon: "pu-des2",
      asset: "pu-des2",
      video: "pu-vid2",
      sound_compose: "pu-snd2",
      sound_impl: "pu-snd2",
      lamp: "pu-lmp1",
      review: "pu-dir1",
    },
    scenes: [
      {
        title: "S1: ロボ起動",
        description: "コックピットから覚醒シーケンス",
        videoNote: "コックピット内 → モニタ点灯",
        soundNote: "メカニカルSE、シンセ起動音",
        lampNote: "赤色グラデーション、徐々に明度UP",
        startSec: 0,
        endSec: 12,
        state: "fixed",
      },
      {
        title: "S2: 起立",
        description: "巨大ロボがカメラ方向に起立する",
        videoNote: "ローアングル、レンズフレア",
        soundNote: "重低音ドカン+メタリックSE",
        lampNote: "全光赤フラッシュ → 白",
        startSec: 12,
        endSec: 26,
        state: "fixed",
      },
      {
        title: "S3: 必殺技 → 結果",
        description: "ロボが必殺技、結果表示",
        videoNote: "高速回転 → 光線 → 結果",
        soundNote: "ボーカルテーマ、結果ジングル",
        lampNote: "ゴールド + ホワイト、流星",
        startSec: 26,
        endSec: 38,
        state: "draft",
      },
    ],
    assets: [
      {
        category: "character",
        name: "カイバー本体",
        fileLabel: "CH_SK_KAIBA_v4.fbx",
        authorId: "pu-des2",
        state: "review",
        version: 4,
        dataKind: "final",
        revisionImpact: "rework",
        finalReceivedDays: -1,
        reworkRequired: true,
      },
      {
        category: "background",
        name: "格納庫",
        fileLabel: "BG_SK_HANGAR.psd",
        authorId: "pu-des2",
        state: "wip",
        version: 1,
        dataKind: "temp",
        revisionImpact: "unknown",
        finalDueDays: 9,
      },
      {
        category: "bgm",
        name: "覚醒テーマ",
        fileLabel: "BGM_SK_AWAKEN.wav",
        authorId: "pu-snd2",
        state: "wip",
        version: 1,
        dataKind: "temp",
        revisionImpact: "rework",
        finalDueDays: 14,
      },
    ],
    soundCues: [
      {
        type: "bgm",
        name: "覚醒テーマ",
        state: "wip",
        assigneeId: "pu-snd2",
        note: "前作からのアレンジ。S2でハイライトに",
      },
      {
        type: "voice",
        name: "ロボ起動音声",
        state: "wip",
        assigneeId: "pu-snd2",
        note: "コックピット内モノローグ",
      },
    ],
    lampCues: [
      {
        name: "起動グラデ",
        pattern: "fade 12s",
        colors: ["#7f1d1d", "#ef4444"],
        state: "wip",
        assigneeId: "pu-lmp1",
        note: "S1全体で徐々に明度UP",
      },
    ],
  },
  {
    id: "pr-sk-002",
    machineId: "m-sk",
    code: "SK-PV-002",
    name: "敵襲予告 (中)",
    category: "preview",
    description: "敵勢力の侵攻を予告する中信頼度演出。",
    durationSec: 5.5,
    priority: "high",
    ownerId: "pu-dir1",
    state: "in_progress",
    targetDate: date(day * 12),
    phaseStates: {
      vcon: "done",
      asset: "done",
      video: "in_progress",
      sound_compose: "done",
      sound_impl: "in_progress",
      lamp: "in_progress",
      review: "todo",
    },
    phaseAssignees: {
      vcon: "pu-des2",
      asset: "pu-des2",
      video: "pu-vid2",
      sound_compose: "pu-snd2",
      sound_impl: "pu-snd2",
      lamp: "pu-lmp1",
      review: "pu-dir1",
    },
    scenes: [
      {
        title: "S1: 警告灯",
        description: "全画面に警告UIフラッシュ",
        videoNote: "赤UI点滅、ノイズエフェクト",
        soundNote: "アラート音、無線ノイズ",
        lampNote: "赤フラッシュ高速点滅",
        startSec: 0,
        endSec: 2.5,
        state: "fixed",
      },
      {
        title: "S2: 敵影出現",
        description: "敵艦のシルエットが画面手前に迫る",
        videoNote: "シルエットのみ、レンズフレア",
        soundNote: "重低音、ストリングス",
        lampNote: "赤 → 紫グラデーション",
        startSec: 2.5,
        endSec: 5.5,
        state: "fixed",
      },
    ],
    assets: [
      {
        category: "ui",
        name: "警告UI一式",
        fileLabel: "UI_SK_ALERT_SET.psd",
        authorId: "pu-des2",
        state: "approved",
        version: 3,
        dataKind: "final",
        revisionImpact: "swap",
        finalReceivedDays: -4,
      },
      {
        category: "se",
        name: "アラート音",
        fileLabel: "SE_SK_ALERT.wav",
        authorId: "pu-snd2",
        state: "approved",
        version: 2,
        dataKind: "final",
        revisionImpact: "swap",
        finalReceivedDays: -3,
      },
    ],
    soundCues: [
      {
        type: "se",
        name: "アラート音",
        state: "approved",
        assigneeId: "pu-snd2",
        note: "0.5秒間隔で3回",
      },
    ],
    lampCues: [
      {
        name: "アラートフラッシュ",
        pattern: "flash 0.2s loop",
        colors: ["#ef4444"],
        state: "review",
        assigneeId: "pu-lmp1",
        note: "S1全期間",
      },
    ],
  },
  {
    id: "pr-sk-003",
    machineId: "m-sk",
    code: "SK-IN-003",
    name: "オープニング・タイトル",
    category: "intro",
    description: "起動時およびデモ画面のタイトルシーケンス。",
    durationSec: 12.0,
    priority: "normal",
    ownerId: "pu-dir1",
    state: "draft",
    targetDate: date(day * 45),
    phaseStates: {
      vcon: "in_progress",
      asset: "blocked",
      video: "blocked",
      sound_compose: "blocked",
      sound_impl: "blocked",
      lamp: "blocked",
      review: "blocked",
    },
    phaseAssignees: {
      vcon: "pu-des2",
      asset: "pu-des2",
      video: "pu-vid2",
      sound_compose: "pu-snd2",
      sound_impl: "pu-snd2",
      lamp: "pu-lmp1",
      review: "pu-dir1",
    },
    scenes: [
      {
        title: "S1: ロゴ",
        description: "メーカーロゴ → タイトルロゴ",
        videoNote: "ドラフト中",
        soundNote: "未定",
        lampNote: "未定",
        startSec: 0,
        endSec: 12,
      },
    ],
    assets: [],
    soundCues: [],
    lampCues: [],
  },
  // ===== Pストレイ・ガーデン =====
  {
    id: "pr-sg-001",
    machineId: "m-sg",
    code: "SG-SR-001",
    name: "幻想庭園リーチ",
    category: "super_reach",
    description: "和風幻想テーマのスーパーリーチ第1弾。",
    durationSec: 35.0,
    priority: "high",
    ownerId: "pu-dir1",
    state: "in_progress",
    targetDate: date(day * 60),
    phaseStates: {
      vcon: "done",
      asset: "in_progress",
      video: "todo",
      sound_compose: "todo",
      sound_impl: "todo",
      lamp: "todo",
      review: "todo",
    },
    phaseAssignees: {
      vcon: "pu-des1",
      asset: "pu-des1",
      video: "pu-vid1",
      sound_compose: "pu-snd1",
      sound_impl: "pu-snd1",
      lamp: "pu-lmp1",
      review: "pu-dir1",
    },
    scenes: [
      {
        title: "S1: 庭園入り",
        description: "主人公が幻想庭園に足を踏み入れる",
        videoNote: "桜舞い、フォグ、Bloom強",
        soundNote: "尺八 + 和琴",
        lampNote: "ピンク→緑のゆるやかな変化",
        startSec: 0,
        endSec: 12,
        state: "fixed",
      },
      {
        title: "S2: 邂逅",
        description: "ヒロインとの出会い",
        videoNote: "クローズアップ → 全景",
        soundNote: "ボーカルIN、ストリングス",
        lampNote: "白色フェードイン",
        startSec: 12,
        endSec: 25,
        state: "fixed",
      },
      {
        title: "S3: 結果",
        description: "桜吹雪 + 結果カット",
        videoNote: "桜吹雪、レイマーチング光",
        soundNote: "クライマックス、結果ジングル",
        lampNote: "ピンク → 虹",
        startSec: 25,
        endSec: 35,
        state: "draft",
      },
    ],
    assets: [
      {
        category: "background",
        name: "幻想庭園_メイン",
        fileLabel: "BG_SG_GARDEN_01.psd",
        authorId: "pu-des1",
        state: "review",
        version: 2,
        dataKind: "temp",
        revisionImpact: "unknown",
        finalDueDays: 30,
      },
      {
        category: "character",
        name: "ヒロイン",
        fileLabel: "CH_SG_HEROINE_v1.fbx",
        authorId: "pu-des1",
        state: "wip",
        version: 1,
        dataKind: "temp",
        revisionImpact: "rework",
        finalDueDays: 42,
      },
      {
        category: "effect",
        name: "桜吹雪",
        fileLabel: "FX_SG_SAKURA.json",
        authorId: "pu-des1",
        state: "wip",
        version: 1,
        dataKind: "temp",
        revisionImpact: "swap",
        finalDueDays: 28,
      },
    ],
    soundCues: [
      {
        type: "bgm",
        name: "幻想庭園テーマ",
        state: "wip",
        assigneeId: "pu-snd1",
        note: "尺八をフィーチャーした和風アレンジ",
      },
    ],
    lampCues: [
      {
        name: "桜グラデ",
        pattern: "fade-cycle 8s",
        colors: ["#fce7f3", "#10b981", "#fbbf24"],
        state: "wip",
        assigneeId: "pu-lmp1",
        note: "S1全期間",
      },
    ],
  },
  {
    id: "pr-sg-002",
    machineId: "m-sg",
    code: "SG-PV-002",
    name: "蝶々予告",
    category: "preview",
    description:
      "画面に蝶が舞い込み、文字が浮かび上がる弱予告。",
    durationSec: 4.0,
    priority: "normal",
    ownerId: "pu-dir1",
    state: "in_progress",
    targetDate: date(day * 18),
    phaseStates: {
      vcon: "done",
      asset: "review",
      video: "todo",
      sound_compose: "in_progress",
      sound_impl: "todo",
      lamp: "todo",
      review: "todo",
    },
    phaseAssignees: {
      vcon: "pu-des1",
      asset: "pu-des1",
      video: "pu-vid1",
      sound_compose: "pu-snd1",
      sound_impl: "pu-snd1",
      lamp: "pu-lmp1",
      review: "pu-dir1",
    },
    scenes: [
      {
        title: "S1: 蝶 出現 → 飛翔",
        description: "中央に蝶が舞い込み、文字を残して消える",
        videoNote: "パーティクル+モーフィング",
        soundNote: "ハープ、軽い鈴音",
        lampNote: "淡いピンク呼吸",
        startSec: 0,
        endSec: 4.0,
        state: "fixed",
      },
    ],
    assets: [
      {
        category: "effect",
        name: "蝶パーティクル",
        fileLabel: "FX_SG_BUTTERFLY.json",
        authorId: "pu-des1",
        state: "review",
        version: 2,
        dataKind: "final",
        revisionImpact: "swap",
        finalReceivedDays: -1,
      },
    ],
    soundCues: [
      {
        type: "se",
        name: "蝶 SE",
        state: "wip",
        assigneeId: "pu-snd1",
        note: "ハープのアルペジオ",
      },
    ],
    lampCues: [
      {
        name: "ピンク呼吸",
        pattern: "breath 4s",
        colors: ["#f472b6"],
        state: "wip",
        assigneeId: "pu-lmp1",
        note: "全期間",
      },
    ],
  },
];

// ============================================================================

export function buildPachinkoSeed(): {
  productions: Production[];
  phases: Phase[];
  scenes: StoryboardScene[];
  assets: Asset[];
  soundCues: SoundCue[];
  lampCues: LampCue[];
  videoTasks: VideoTask[];
} {
  const productions: Production[] = [];
  const phases: Phase[] = [];
  const scenes: StoryboardScene[] = [];
  const assets: Asset[] = [];
  const soundCues: SoundCue[] = [];
  const lampCues: LampCue[] = [];
  const videoTasks: VideoTask[] = [];

  for (const input of PRODUCTION_INPUT) {
    productions.push({
      id: input.id,
      machineId: input.machineId,
      code: input.code,
      name: input.name,
      category: input.category,
      description: input.description,
      durationSec: input.durationSec,
      priority: input.priority,
      ownerId: input.ownerId,
      state: input.state,
      targetDate: input.targetDate,
      createdAt: iso(-day * 25),
      updatedAt: iso(-day * 1),
    });

    // Phase 生成
    const phaseStateMap: Partial<Record<PhaseType, PhaseState>> = {
      ...input.phaseStates,
    };
    for (const t of PHASE_ORDER) {
      let st: PhaseState = phaseStateMap[t] ?? "todo";
      const deps = PHASE_DEPENDENCIES[t];
      const allDepsDone = deps.every(
        (d) => phaseStateMap[d] === "done" || phaseStateMap[d] === "review"
      );
      if (!allDepsDone && st !== "done" && st !== "review" && st !== "in_progress") {
        st = "blocked";
      }
      phases.push({
        id: `ph-${input.id}-${t}`,
        productionId: input.id,
        type: t,
        state: st,
        assigneeId: input.phaseAssignees[t] ?? null,
        estimatedHours:
          t === "vcon" ? 8 : t === "asset" ? 24 : t === "video" ? 32 : 16,
        actualHours:
          st === "done"
            ? t === "vcon"
              ? 7
              : t === "asset"
                ? 22
                : 30
            : undefined,
        startDate: undefined,
        dueDate: input.targetDate,
        completedAt: st === "done" ? iso(-day * 2) : undefined,
        note: "",
      });
    }

    // Scene 生成
    input.scenes.forEach((s, idx) => {
      scenes.push({
        id: `sc-${input.id}-${idx + 1}`,
        productionId: input.id,
        order: idx + 1,
        startSec: s.startSec,
        endSec: s.endSec,
        title: s.title,
        description: s.description,
        videoNote: s.videoNote,
        soundNote: s.soundNote,
        lampNote: s.lampNote,
        state: s.state ?? "draft",
      });
    });

    // Asset
    input.assets.forEach((a, idx) => {
      assets.push({
        id: `as-${input.id}-${idx + 1}`,
        machineId: input.machineId,
        productionId: input.id,
        category: a.category,
        name: a.name,
        fileLabel: a.fileLabel,
        authorId: a.authorId,
        state: a.state,
        version: a.version,
        updatedAt: iso(-day * (idx + 1)),
        thumbHue: ((idx + 3) * 47) % 360,
        dataKind: a.dataKind ?? "temp",
        revisionImpact: a.revisionImpact ?? "unknown",
        finalDueDate:
          a.finalDueDays !== undefined ? date(day * a.finalDueDays) : undefined,
        finalReceivedAt:
          a.finalReceivedDays !== undefined
            ? iso(day * a.finalReceivedDays)
            : undefined,
        reworkRequired: a.reworkRequired,
        reworkDoneAt:
          a.reworkDoneDays !== undefined ? iso(day * a.reworkDoneDays) : undefined,
      });
    });

    // SoundCue
    input.soundCues.forEach((c, idx) => {
      soundCues.push({
        id: `sc-${input.id}-snd-${idx + 1}`,
        productionId: input.id,
        type: c.type,
        name: c.name,
        state: c.state,
        assigneeId: c.assigneeId,
        note: c.note,
      });
    });

    // LampCue
    input.lampCues.forEach((c, idx) => {
      lampCues.push({
        id: `lc-${input.id}-lmp-${idx + 1}`,
        productionId: input.id,
        name: c.name,
        pattern: c.pattern,
        colors: c.colors,
        state: c.state,
        assigneeId: c.assigneeId,
        note: c.note,
      });
    });

    // VideoTask: 最初の演出にだけ要件サンプルを生成
    const videoAssignee = input.phaseAssignees.video ?? null;
    const seedTasks: Array<Pick<VideoTask, "name" | "description" | "estimatedHours" | "state"> & { actualHours?: number }> =
      input.id === PRODUCTION_INPUT[0]?.id
        ? [
            {
              name: "シーン遷移タイミング設計",
              description: "Vコンテに合わせてシーン切替の尺を確定",
              estimatedHours: 4,
              state: "done",
              actualHours: 5,
            },
            {
              name: "リーチ突入カットイン実装",
              description: "演出フローエンジンへの組み込み",
              estimatedHours: 8,
              state: "in_progress",
              actualHours: 3,
            },
            {
              name: "確定パターン実装",
              description: "リーチ確定演出の分岐実装",
              estimatedHours: 6,
              state: "todo",
            },
          ]
        : [];
    seedTasks.forEach((t, idx) => {
      videoTasks.push({
        id: `vt-${input.id}-${idx + 1}`,
        productionId: input.id,
        order: idx + 1,
        name: t.name,
        description: t.description,
        estimatedHours: t.estimatedHours,
        actualHours: t.actualHours,
        assigneeId: videoAssignee,
        state: t.state,
      });
    });
  }

  // video phase の予実工数を VideoTask 合計に同期
  for (const production of productions) {
    const tasks = videoTasks.filter((t) => t.productionId === production.id);
    if (tasks.length === 0) continue;
    const est = tasks.reduce((s, t) => s + (t.estimatedHours || 0), 0);
    const hasActual = tasks.some((t) => t.actualHours !== undefined);
    const act = hasActual
      ? tasks.reduce((s, t) => s + (t.actualHours ?? 0), 0)
      : undefined;
    for (const ph of phases) {
      if (ph.productionId === production.id && ph.type === "video") {
        ph.estimatedHours = est;
        ph.actualHours = act;
      }
    }
  }

  return { productions, phases, scenes, assets, soundCues, lampCues, videoTasks };
}
