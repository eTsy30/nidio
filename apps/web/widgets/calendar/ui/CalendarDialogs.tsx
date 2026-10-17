import { CreateEventForm } from "@/features/calendar/create-event/ui/CreateEventForm";
import { DeleteEventDialog } from "@/features/calendar/delete-event/ui/DeleteEventDialog";
import { EditEventForm } from "@/features/calendar/edit-event/ui/EditEventForm";
import type { CalendarEventFormValues, EventScope } from "@/features/calendar/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog/dialog";

import type { CalendarModal } from "../model/useCalendarModal";

interface Props {
  modal: CalendarModal;
  selectedDate: Date;
  scope: EventScope;
  updating: boolean;
  closeModal: () => void;
  onDeleted: () => Promise<unknown>;
  onCreate: (values: CalendarEventFormValues) => Promise<void>;
  onUpdate: (values: CalendarEventFormValues) => Promise<void>;
}
export function CalendarDialogs({
  modal,
  selectedDate,
  scope,
  updating,
  closeModal,
  onDeleted,
  onCreate,
  onUpdate,
}: Props) {
  return (
    <>
      {modal.kind === "delete" && (
        <DeleteEventDialog
          key={modal.event.id}
          event={modal.event}
          open
          onOpenChange={(open) => {
            if (!open) closeModal();
          }}
          onDeleted={() => {
            void onDeleted();
          }}
        />
      )}

      {modal.kind === "create" && selectedDate && (
        <Dialog open onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="gap-4 p-4 sm:max-w-lg sm:p-5">
            <DialogHeader>
              <DialogTitle>Новое событие</DialogTitle>
              <DialogDescription>Добавьте момент в календарь</DialogDescription>
            </DialogHeader>
            <CreateEventForm
              scope={scope}
              date={selectedDate}
              onCancel={closeModal}
              onSubmit={onCreate}
            />
          </DialogContent>
        </Dialog>
      )}

      {modal.kind === "edit" && (
        <Dialog open onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="gap-4 p-4 sm:max-w-lg sm:p-5">
            <DialogHeader>
              <DialogTitle>Редактировать событие</DialogTitle>
              <DialogDescription>Измените детали события</DialogDescription>
            </DialogHeader>

            <EditEventForm event={modal.event} onCancel={closeModal} onSubmit={onUpdate} />

            {updating && (
              <p className="mt-3 text-center text-xs text-muted-foreground">Сохраняем изменения…</p>
            )}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
