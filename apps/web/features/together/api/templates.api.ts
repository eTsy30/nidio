import { api } from "@/shared/api/client/api";

import { Template } from "../model/templates";

export const templatesApi = {
  getAll: () => api.get<Template[]>("/templates").then((res) => res.data),

  apply: (templateId: string) => api.post(`/templates/${templateId}/apply`).then((res) => res.data),

  createFromColumn: (columnId: string, title: string) =>
    api.post("/templates/from-column", { columnId, title }).then((res) => res.data),
};
