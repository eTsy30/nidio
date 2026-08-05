import {
  Clover,
  Flame,
  Frown,
  Heart,
  Laugh,
  Rocket,
  Smile,
  Star,
  ThumbsUp,
  Zap,
} from "lucide-react";

const REACTION_ICONS = {
  heart: Heart,
  thumbsUp: ThumbsUp,
  laugh: Laugh,
  star: Star,
  flame: Flame,
  frown: Frown,
  zap: Zap,
  rocket: Rocket,
  clover: Clover,
} as const;

export type ReactionKey = keyof typeof REACTION_ICONS;

export const REACTION_KEYS: ReactionKey[] = [
  "heart",
  "thumbsUp",
  "laugh",
  "star",
  "flame",
  "frown",
  "zap",
  "rocket",
  "clover",
];

export const REACTION_COLORS: Record<
  ReactionKey,
  { active: string; inactive: string; activeText: string; inactiveText: string }
> = {
  heart: {
    active: "bg-red-500/20",
    inactive: "bg-red-500/10 hover:bg-red-500/20",
    activeText: "text-red-500",
    inactiveText: "text-red-500/70",
  },
  thumbsUp: {
    active: "bg-blue-500/20",
    inactive: "bg-blue-500/10 hover:bg-blue-500/20",
    activeText: "text-blue-500",
    inactiveText: "text-blue-500/70",
  },
  laugh: {
    active: "bg-amber-500/20",
    inactive: "bg-amber-500/10 hover:bg-amber-500/20",
    activeText: "text-amber-600",
    inactiveText: "text-amber-600/70",
  },
  star: {
    active: "bg-violet-500/20",
    inactive: "bg-violet-500/10 hover:bg-violet-500/20",
    activeText: "text-violet-500",
    inactiveText: "text-violet-500/70",
  },
  flame: {
    active: "bg-orange-500/20",
    inactive: "bg-orange-500/10 hover:bg-orange-500/20",
    activeText: "text-orange-500",
    inactiveText: "text-orange-500/70",
  },
  frown: {
    active: "bg-slate-500/20",
    inactive: "bg-slate-500/10 hover:bg-slate-500/20",
    activeText: "text-slate-500",
    inactiveText: "text-slate-500/70",
  },
  zap: {
    active: "bg-yellow-500/20",
    inactive: "bg-yellow-500/10 hover:bg-yellow-500/20",
    activeText: "text-yellow-600",
    inactiveText: "text-yellow-600/70",
  },
  rocket: {
    active: "bg-indigo-500/20",
    inactive: "bg-indigo-500/10 hover:bg-indigo-500/20",
    activeText: "text-indigo-500",
    inactiveText: "text-indigo-500/70",
  },
  clover: {
    active: "bg-green-500/20",
    inactive: "bg-green-500/10 hover:bg-green-500/20",
    activeText: "text-green-500",
    inactiveText: "text-green-500/70",
  },
};

export function ReactionIcon({ name, className }: { name: string; className?: string }) {
  const Icon = REACTION_ICONS[name as ReactionKey] || Smile;
  return <Icon className={className} />;
}
