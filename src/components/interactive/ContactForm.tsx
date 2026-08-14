"use client";

import { useState } from "react";
import { ContactData, UiLabels } from "@/types/content";
import { cn } from "@/lib/utils";

interface ContactFormProps {
  contactData: ContactData;
  uiLabels: UiLabels;
}

// "rateLimited" berdiri sendiri: batas 3-per-jam di /api/contact sebelumnya
// tampil sebagai pesan error umum, jadi pengirim mencoba lagi dan menghabiskan
// sisa jatahnya tanpa pernah tahu apa yang terjadi.
type FormStatus = "idle" | "loading" | "success" | "error" | "rateLimited";

const fieldBase =
  "ink-border w-full bg-(--wash) px-[15px] py-3 text-[14px] outline-none placeholder:text-(--soft)";

export default function ContactForm({
  contactData,
  uiLabels,
}: ContactFormProps) {
  const [status, setStatus] = useState<FormStatus>("idle");
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { form } = contactData;

  const handleChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Kesalahan yang lama menempel setelah pengguna memperbaiki isiannya cuma
    // membingungkan; sukses tetap dibiarkan sampai halaman dimuat ulang.
    setStatus((prev) =>
      prev === "error" || prev === "rateLimited" ? "idle" : prev,
    );
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
        setStatus(res.status === 429 ? "rateLimited" : "error");
      }
    } catch {
      setStatus("error");
    }
  };

  const submitLabel =
    status === "loading"
      ? uiLabels.buttons.loading
      : status === "success"
        ? uiLabels.buttons.success
        : uiLabels.buttons.submit;

  const statusMessage =
    status === "success"
      ? uiLabels.states.success
      : status === "rateLimited"
        ? uiLabels.states.rateLimited
        : status === "error"
          ? uiLabels.states.error
          : null;

  return (
    <form
      onSubmit={handleSubmit}
      className="r-frame ink-border flat-5 flex flex-col gap-[18px] bg-(--paper) p-7"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {form.fields.map((field, index) => {
          const isShort = field.type === "text" || field.type === "email";
          const mirrored = index % 2 === 1;

          return (
            <label
              key={field.id}
              className={cn(
                "flex flex-col gap-[7px]",
                !isShort && "sm:col-span-2",
              )}
            >
              <span className="micro">
                {field.label}
                {field.required && (
                  <span className="text-(--accent-ink)"> *</span>
                )}
              </span>

              {field.type === "textarea" ? (
                <textarea
                  id={field.id}
                  name={field.name}
                  rows={5}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={cn(fieldBase, "r-card resize-y py-3.5")}
                />
              ) : field.type === "select" && field.options ? (
                <select
                  id={field.id}
                  name={field.name}
                  required={field.required}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={cn(
                    fieldBase,
                    "r-chip cursor-pointer appearance-none",
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
              ) : (
                <input
                  id={field.id}
                  type={field.type}
                  name={field.name}
                  required={field.required}
                  placeholder={field.placeholder}
                  value={formData[field.name] ?? ""}
                  onChange={(e) => handleChange(field.name, e.target.value)}
                  className={cn(fieldBase, mirrored ? "r-chip-alt" : "r-chip")}
                />
              )}
            </label>
          );
        })}
      </div>

      {/*
        Honeypot. Disembunyikan di luar layar, bukan dengan `display:none` —
        sebagian bot melewati field yang benar-benar tidak dirender. Manusia
        tidak akan pernah mengisinya (aria-hidden + tabIndex -1), jadi isian di
        sini berarti pengirimnya bot dan API membuangnya diam-diam.
      */}
      <div
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website ?? ""}
          onChange={(e) => handleChange("website", e.target.value)}
        />
      </div>

      {/*
        Selalu dirender dan tidak pernah disembunyikan: pembaca layar perlu
        sudah mengamati wadahnya sebelum isinya berubah. Region yang muncul
        berbarengan dengan teksnya (`display:none` lalu tampil) kerap tidak
        diumumkan sama sekali. Sebelum ini keberhasilan hanya mengubah label
        tombol, jadi pengguna pembaca layar tidak mendapat konfirmasi apa pun.
      */}
      <div role="status" aria-live="polite">
        {statusMessage && (
          <p
            className={cn(
              "ink-border-dashed r-chip m-0 px-4 py-3 text-[13px] font-semibold",
              status === "success" ? "text-(--accent-ink)" : "text-(--soft)",
            )}
          >
            {statusMessage}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={status === "loading" || status === "success"}
        className={cn(
          "r-btn ink-border flat-3 lift-btn self-start px-[30px] py-[13px]",
          "cursor-pointer bg-(--accent) text-[14px] font-bold text-white outline-none",
          (status === "loading" || status === "success") &&
            "pointer-events-none opacity-70",
        )}
      >
        {submitLabel}
      </button>
    </form>
  );
}
