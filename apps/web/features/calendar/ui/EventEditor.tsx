import { Button } from "@/shared/ui";
import { DialogFooter } from "@/shared/ui/dialog/dialog";

import type { EventFormModel } from "../model/use-event-form";

import { EventFormFields } from "./EventFormFields";

export function EventEditor({
  form,
  onCancel,
  recurring,
  mode,
}: {
  form: EventFormModel;
  mode: "create" | "edit";
  onCancel: () => void;
  recurring?: boolean;
}) {
  return (
    <form onSubmit={form.handleSubmit} className="min-w-0 space-y-5">
      <fieldset disabled={form.saving} className="min-w-0 space-y-5">
        <EventFormFields mode={mode} form={form} recurring={recurring ?? false} />
      </fieldset>
      {form.error && (
        <p role="alert" className="text-sm text-destructive">
          {form.error}
        </p>
      )}
      <DialogFooter>
        <Button type="button" variant="secondary" disabled={form.saving} onClick={onCancel}>
          Отмена
        </Button>
        <Button type="submit" disabled={!form.title.trim() || form.saving}>
          {form.saving ? "Сохраняем…" : "Готово"}
        </Button>
      </DialogFooter>
    </form>
  );
}
