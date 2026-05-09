"use client";

import { useState } from "react";
import { ContactData, UiLabels } from "@/types/content";
import { cn, themeTransition } from "@/lib/utils";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ContactFormProps {
  contactData: ContactData;
  uiLabels: UiLabels;
}

type FormStatus = "idle" | "loading" | "success" | "error";

export default function ContactForm({
  contactData,
  uiLabels,
}: ContactFormProps) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { form } = contactData;

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setStatus("success");
        setFormData({});
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  const fieldBaseClasses =
    "w-full bg-(--background) border-2 border-(--border) px-4 py-3 text-sm font-medium text-(--foreground) placeholder:text-(--gray-medium) focus:outline-none focus:border-(--accent) transition-colors duration-150";

  const submitLabel =
    status === "loading"
      ? uiLabels.buttons.loading || "Please wait..."
      : status === "success"
        ? uiLabels.buttons.success || "Message Sent!"
        : uiLabels.buttons[form.submitAction.uiKey] || "Send Message";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {form.fields.map((field) => {
        if (field.type === "textarea") {
          return (
            <div key={field.id} className="flex flex-col gap-2">
              <label
                htmlFor={field.id}
                className="text-xs font-black uppercase tracking-widest text-(--gray-medium)"
              >
                {field.label}{" "}
                {field.required && <span className="text-(--accent)">*</span>}
              </label>
              <textarea
                id={field.id}
                name={field.name}
                placeholder={field.placeholder}
                required={field.required}
                rows={5}
                value={formData[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className={cn(fieldBaseClasses, "resize-none")}
              />
            </div>
          );
        }

        if (field.type === "select" && field.options) {
          return (
            <div key={field.id} className="flex flex-col gap-2">
              <label
                htmlFor={field.id}
                className="text-xs font-black uppercase tracking-widest text-(--gray-medium)"
              >
                {field.label}{" "}
                {field.required && <span className="text-(--accent)">*</span>}
              </label>
              <select
                id={field.id}
                name={field.name}
                required={field.required}
                value={formData[field.name] || ""}
                onChange={(e) => handleChange(field.name, e.target.value)}
                className={cn(
                  fieldBaseClasses,
                  "cursor-pointer appearance-none",
                  themeTransition,
                )}
              >
                <option value="" disabled>
                  {field.placeholder}
                </option>
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }

        return (
          <div key={field.id} className="flex flex-col gap-2">
            <label
              htmlFor={field.id}
              className="text-xs font-black uppercase tracking-widest text-(--gray-medium)"
            >
              {field.label}{" "}
              {field.required && <span className="text-(--accent)">*</span>}
            </label>
            <input
              id={field.id}
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              required={field.required}
              value={formData[field.name] || ""}
              onChange={(e) => handleChange(field.name, e.target.value)}
              className={fieldBaseClasses}
            />
          </div>
        );
      })}

      {/* Status Messages */}
      {status === "success" && (
        <div className="flex items-center gap-3 p-4 border-2 border-green-500 bg-green-500/10 text-green-500">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold">
            {uiLabels.buttons.success || "Message sent successfully!"}
          </p>
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-3 p-4 border-2 border-red-500 bg-red-500/10 text-red-500">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold">
            {uiLabels.states.error || "Something went wrong. Please try again."}
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className={cn(
          "mt-2 w-full flex items-center justify-center gap-2 px-6 py-4 text-sm font-black uppercase tracking-widest transition-all duration-150 border-2",
          status === "success"
            ? "bg-green-500 border-green-500 text-white cursor-default"
            : "bg-(--accent) border-(--accent) text-white hover:bg-transparent hover:text-(--accent) disabled:opacity-60 disabled:cursor-not-allowed active:translate-x-0.5 active:translate-y-0.5",
        )}
      >
        {status === "loading" && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitLabel}
      </button>
    </form>
  );
}
