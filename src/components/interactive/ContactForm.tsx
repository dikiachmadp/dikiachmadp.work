"use client";

import { useState } from "react";
import { ContactData, UiLabels } from "@/types/content";
import { cn, themeTransition } from "@/lib/utils";
import { CheckCircle, AlertCircle, Loader2, Send } from "lucide-react";

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

  const labelClasses =
    "text-[10px] font-bold uppercase tracking-[0.2em] text-(--foreground) mb-3 ml-1 flex items-center gap-1";

  const submitLabel =
    status === "loading"
      ? uiLabels.buttons.loading || "Please wait..."
      : status === "success"
        ? uiLabels.buttons.success || "Message Sent!"
        : uiLabels.buttons[
            form.submitAction.uiKey as keyof typeof uiLabels.buttons
          ] || "Send Message";

  return (
    <div className="relative w-full max-w-2xl">
      {/* Form Container Shadow */}
      <div className="absolute inset-0 bg-(--foreground) rounded-2xl transition-all duration-200" />

      {/* Form Container Content */}
      <div
        className={cn(
          "relative bg-(--background) border-2 border-(--foreground) rounded-2xl p-8 md:p-12",
          themeTransition,
        )}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-10">
          <div className="grid grid-cols-1 gap-8">
            {form.fields.map((field) => (
              <div key={field.id} className="flex flex-col w-full">
                <label htmlFor={field.id} className={labelClasses}>
                  {field.label}
                  {field.required && (
                    <span className="text-(--accent) text-sm leading-none">
                      *
                    </span>
                  )}
                </label>

                {/* Input Layer Container - Group for input focus effect */}
                <div className="relative group w-full">
                  <div className="absolute inset-0 bg-(--foreground) rounded-lg transition-all duration-200" />
                  <div
                    className={cn(
                      "relative bg-(--background) border-2 border-(--foreground) rounded-lg transition-all duration-200 px-4",
                      "group-focus-within:-translate-x-1 group-focus-within:-translate-y-1",
                      themeTransition,
                    )}
                  >
                    {field.type === "textarea" ? (
                      <textarea
                        id={field.id}
                        name={field.name}
                        placeholder={field.placeholder}
                        required={field.required}
                        rows={4}
                        value={formData[field.name] || ""}
                        onChange={(e) =>
                          handleChange(field.name, e.target.value)
                        }
                        className="w-full bg-transparent py-4 outline-none text-[10px] font-bold tracking-widest text-(--foreground) placeholder:text-(--gray-medium) resize-none"
                      />
                    ) : field.type === "select" && field.options ? (
                      <div className="relative w-full">
                        <select
                          id={field.id}
                          name={field.name}
                          required={field.required}
                          value={formData[field.name] || ""}
                          onChange={(e) =>
                            handleChange(field.name, e.target.value)
                          }
                          className="w-full bg-transparent py-4 outline-none text-[10px] font-bold tracking-widest text-(--foreground) appearance-none cursor-pointer"
                        >
                          <option
                            value=""
                            disabled
                            className="bg-(--background)"
                          >
                            {field.placeholder}
                          </option>
                          {field.options.map((opt) => (
                            <option
                              key={opt.value}
                              value={opt.value}
                              className="bg-(--background)"
                            >
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none">
                          <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[5px] border-t-(--foreground)" />
                        </div>
                      </div>
                    ) : (
                      <input
                        id={field.id}
                        type={field.type}
                        name={field.name}
                        placeholder={field.placeholder}
                        required={field.required}
                        value={formData[field.name] || ""}
                        onChange={(e) =>
                          handleChange(field.name, e.target.value)
                        }
                        className="w-full bg-transparent py-4 outline-none text-[10px] font-bold tracking-widest text-(--foreground) placeholder:text-(--gray-medium)"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Status Messages */}
          {(status === "success" || status === "error") && (
            <div
              className={cn(
                "p-6 border-2 border-dashed rounded-lg text-center transition-all",
                status === "success"
                  ? "border-green-500/50 bg-green-500/5"
                  : "border-red-500/50 bg-red-500/5",
              )}
            >
              <p
                className={cn(
                  "font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-3",
                  status === "success" ? "text-green-600" : "text-red-600",
                )}
              >
                {status === "success" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                {status === "success"
                  ? uiLabels.buttons.success || "Message sent successfully!"
                  : uiLabels.states.error || "Something went wrong."}
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-start">
            {/* Button Layer Container - Group scoped only to the button */}
            <button
              type="submit"
              disabled={status === "loading" || status === "success"}
              className="group relative outline-none disabled:opacity-60"
            >
              <div className="absolute inset-0 rounded-lg bg-(--foreground) transition-all duration-200" />
              <div
                className={cn(
                  "relative flex h-12 px-10 items-center justify-center rounded-lg uppercase transition-all duration-200 text-[10px] font-bold tracking-[0.2em] border-2",
                  themeTransition,
                  // Success State
                  status === "success"
                    ? "bg-green-500 text-white border-green-500"
                    : // Normal State with scoped hover effect
                      "bg-(--background) text-(--foreground) border-(--foreground) group-hover:-translate-x-1 group-hover:-translate-y-1 group-active:translate-x-0 group-active:translate-y-0",
                )}
              >
                {status === "loading" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Send className="w-3.5 h-3.5 mr-2" />
                )}
                {submitLabel}
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
