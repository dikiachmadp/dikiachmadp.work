import { cn } from "@/lib/utils";

interface BaseProps {
  name: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
}

/** Kelas input dipakai bersama oleh field teks, textarea, dan select. */
const controlClass =
  "r-chip ink-border w-full bg-(--wash) px-[15px] py-3 text-[14px] outline-none placeholder:text-(--soft)";

function Shell({
  label,
  error,
  hint,
  required,
  className,
  children,
}: Pick<BaseProps, "label" | "error" | "hint" | "required" | "className"> & {
  children: React.ReactNode;
}) {
  return (
    <label className={cn("flex flex-col gap-[7px]", className)}>
      <span className="micro">
        {label}
        {required && <span className="text-(--accent-ink)"> *</span>}
      </span>
      {children}
      {hint && !error && (
        <span className="text-[11px] text-(--soft)">{hint}</span>
      )}
      {error && (
        <span
          role="alert"
          className="text-[11px] font-bold text-(--accent-ink)"
        >
          {error}
        </span>
      )}
    </label>
  );
}

export function AdminField({
  type = "text",
  placeholder,
  ...props
}: BaseProps & { type?: string; placeholder?: string }) {
  return (
    <Shell {...props}>
      <input
        name={props.name}
        type={type}
        placeholder={placeholder}
        defaultValue={props.defaultValue}
        aria-invalid={Boolean(props.error)}
        className={cn(controlClass, props.error && "border-(--accent-ink)")}
      />
    </Shell>
  );
}

export function AdminTextarea({
  rows = 4,
  placeholder,
  ...props
}: BaseProps & { rows?: number; placeholder?: string }) {
  return (
    <Shell {...props}>
      <textarea
        name={props.name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={props.defaultValue}
        aria-invalid={Boolean(props.error)}
        className={cn(
          controlClass,
          "resize-y",
          props.error && "border-(--accent-ink)",
        )}
      />
    </Shell>
  );
}

export function AdminSelect({
  options,
  value,
  onChange,
  ...props
}: BaseProps & {
  /**
   * String polos kalau nilai dan labelnya sama. Bentuk `{value,label}` untuk
   * kasus di mana yang dikirim berbeda dari yang dibaca — kategori project
   * mengirim kunci stabil tapi menampilkan label berbahasa.
   */
  options: (string | { value: string; label: string })[];
  /** Isi keduanya untuk select terkendali; kosongkan untuk uncontrolled. */
  value?: string;
  onChange?: (value: string) => void;
}) {
  return (
    <Shell {...props}>
      <select
        name={props.name}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        defaultValue={value === undefined ? props.defaultValue : undefined}
        aria-invalid={Boolean(props.error)}
        className={cn(
          controlClass,
          "cursor-pointer",
          props.error && "border-(--accent-ink)",
        )}
      >
        {options.map((option) => {
          const { value: optionValue, label } =
            typeof option === "string"
              ? { value: option, label: option }
              : option;
          return (
            <option key={optionValue} value={optionValue}>
              {label}
            </option>
          );
        })}
      </select>
    </Shell>
  );
}

export function AdminFile({
  accept = "image/*",
  multiple,
  ...props
}: Omit<BaseProps, "defaultValue"> & { accept?: string; multiple?: boolean }) {
  return (
    <Shell {...props}>
      <input
        name={props.name}
        type="file"
        accept={accept}
        multiple={multiple}
        className="ink-border-dashed r-chip w-full cursor-pointer bg-(--wash) px-[15px] py-2.5 text-[12px] text-(--soft) file:mr-3 file:cursor-pointer file:border-0 file:bg-transparent file:text-[12px] file:font-bold file:text-(--ink)"
      />
    </Shell>
  );
}

export function AdminCheckbox({
  name,
  label,
  defaultChecked,
}: {
  name: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="r-chip ink-border flex cursor-pointer items-center gap-2.5 bg-(--wash) px-[15px] py-3">
      <input
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 cursor-pointer accent-(--accent)"
      />
      <span className="text-[13px] font-semibold">{label}</span>
    </label>
  );
}

export function AdminFieldset({
  legend,
  children,
  className,
}: {
  legend: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset
      className={cn(
        "r-card ink-border flat-3 flex flex-col gap-3.5 bg-(--paper) p-5",
        className,
      )}
    >
      <legend className="font-hand px-2 text-[21px]">{legend}</legend>
      {children}
    </fieldset>
  );
}
