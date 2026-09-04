export const togetherKeys = {
  all: ["together"] as const,
  list: () => [...togetherKeys.all, "list"] as const,
  today: () => [...togetherKeys.all, "today"] as const,
  summary: () => [...togetherKeys.all, "summary"] as const,
  board: () => [...togetherKeys.all, "board"] as const,
  templates: () => [...togetherKeys.all, "templates"] as const,
};
