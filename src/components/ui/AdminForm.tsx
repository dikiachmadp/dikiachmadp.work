import { ReactNode } from "react";
import { cn } from "@/lib/utils";

const FIELDS = [
  { name: "title", label: "Title", type: "text" },
  { name: "slug", label: "Slug", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "imageUrl", label: "Image URL", type: "text" },
] as const;

interface AdminFormProps {
  title: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  defaults?: Partial<Record<(typeof FIELDS)[number]["name"], string>>;
  children?: ReactNode;
}

/** Shared create/edit form for the project CRUD screens. */
export default function AdminForm({
  title,
  submitLabel,
  action,
  defaults,
  children,
}: AdminFormProps) {
  return (
    <div className="r-frame ink-border flat-5 mx-auto max-w-[520px] bg-(--paper) p-7">
      <h1 className="font-hand mb-5 text-[30px] leading-none">{title}</h1>
      <form action={action} className="flex flex-col gap-3.5">
        {children}
        {FIELDS.map((field, i) => (
          <label key={field.name} className="flex flex-col gap-[7px]">
            <span className="micro">{field.label}</span>
            {field.type === "textarea" ? (
              <textarea
                name={field.name}
                rows={4}
                required
                defaultValue={defaults?.[field.name]}
                className="r-card ink-border w-full resize-y bg-(--wash) px-[15px] py-3 text-[14px] outline-none"
              />
            ) : (
              <input
                name={field.name}
                type="text"
                required
                defaultValue={defaults?.[field.name]}
                className={cn(
                  "ink-border w-full bg-(--wash) px-[15px] py-3 text-[14px] outline-none",
                  i % 2 === 0 ? "r-chip" : "r-chip-alt",
                )}
              />
            )}
          </label>
        ))}
        <button
          type="submit"
          className="r-btn ink-border flat-3 lift-btn mt-1 cursor-pointer self-start bg-(--accent) px-[26px] py-[13px] text-[14px] font-bold text-white outline-none"
        >
          {submitLabel}
        </button>
      </form>
    </div>
  );
}
