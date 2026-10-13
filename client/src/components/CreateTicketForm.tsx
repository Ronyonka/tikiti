import { FormEvent, useState } from "react";
import { ApiError, createTicket, type TicketPriority } from "../api";
import { getPriorityLabel } from "../labels";
import "./CreateTicketForm.css";

type FieldErrors = Partial<Record<"title" | "description" | "priority", string>>;

export function CreateTicketForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("medium");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setFieldErrors({ title: "Title is required" });
      setFormError(null);
      return;
    }

    setSubmitting(true);
    setFieldErrors({});
    setFormError(null);
    try {
      const trimmedDescription = description.trim();
      await createTicket({
        title: trimmedTitle,
        ...(trimmedDescription ? { description } : {}),
        priority,
      });
      setTitle("");
      setDescription("");
      setPriority("medium");
      onSuccess();
    } catch (error: unknown) {
      if (error instanceof ApiError && error.details.length > 0) {
        const nextFieldErrors: FieldErrors = {};
        const unmatchedMessages: string[] = [];
        error.details.forEach((detail) => {
          if (detail.field === "title" || detail.field === "description" || detail.field === "priority") {
            nextFieldErrors[detail.field] = detail.message;
          } else {
            unmatchedMessages.push(detail.message);
          }
        });
        setFieldErrors(nextFieldErrors);
        setFormError(unmatchedMessages.length > 0 ? unmatchedMessages.join(" ") : null);
      } else {
        setFormError(error instanceof Error ? error.message : "Request failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fieldDescriptionId = "create-description-error";
  const fieldPriorityId = "create-priority-error";
  const fieldTitleId = "create-title-error";

  return (
    <form className="create-ticket-form" onSubmit={handleSubmit} noValidate>
      <div className="create-ticket-fields">
        <div className="form-field">
          <label htmlFor="create-title">Title</label>
          <input
            id="create-title"
            type="text"
            value={title}
            maxLength={200}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? fieldTitleId : undefined}
            onChange={(event) => { setTitle(event.target.value); clearFieldError("title"); }}
          />
          {fieldErrors.title ? <p className="field-error" id={fieldTitleId}>{fieldErrors.title}</p> : null}
        </div>
        <div className="form-field">
          <label htmlFor="create-description">Description</label>
          <textarea
            id="create-description"
            value={description}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={fieldErrors.description ? fieldDescriptionId : undefined}
            onChange={(event) => { setDescription(event.target.value); clearFieldError("description"); }}
          />
          {fieldErrors.description ? <p className="field-error" id={fieldDescriptionId}>{fieldErrors.description}</p> : null}
        </div>
        <div className="form-field priority-field">
          <label htmlFor="create-priority">Priority</label>
          <select
            id="create-priority"
            value={priority}
            disabled={submitting}
            aria-invalid={Boolean(fieldErrors.priority)}
            aria-describedby={fieldErrors.priority ? fieldPriorityId : undefined}
            onChange={(event) => { setPriority(event.target.value as TicketPriority); clearFieldError("priority"); }}
          >
            <option value="low">{getPriorityLabel("low")}</option>
            <option value="medium">{getPriorityLabel("medium")}</option>
            <option value="high">{getPriorityLabel("high")}</option>
          </select>
          {fieldErrors.priority ? <p className="field-error" id={fieldPriorityId}>{fieldErrors.priority}</p> : null}
        </div>
      </div>
      {formError ? <p className="form-error" role="alert">{formError}</p> : null}
      <button type="submit" disabled={submitting}>Create ticket</button>
    </form>
  );
}
