// @vitest-environment jsdom
import { act, useActionState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AdminCheckbox, AdminSelect } from "./AdminField";
import { formValues, initialFormState, type FormState } from "@/schemas/admin";

// React 19 me-reset setiap field tak terkendali begitu server action selesai,
// jadi satu-satunya cara membuktikan AC-8 ("validasi gagal mengembalikan semua
// nilai yang dikirim") adalah menjalankan siklus itu di DOM sungguhan.
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

/** Selalu gagal, seperti coverImage dengan host di luar daftar izin. */
async function reject(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  return {
    status: "error",
    fieldErrors: { coverImage: "Host gambar tidak diizinkan" },
    values: formValues(formData),
  };
}

/**
 * Bentuk minimal ProductForm: satu select status, dua checkbox, dan pembaca
 * `state.values` yang sama persis dengan yang dipakai form aslinya.
 */
function Harness({
  status = "DRAFT",
  featured = false,
  pwywEnabled = false,
}: {
  status?: string;
  featured?: boolean;
  pwywEnabled?: boolean;
}) {
  const [state, formAction] = useActionState(reject, initialFormState);
  const v = (name: string, fallback: string) =>
    state.values?.[name] ?? fallback;
  // Idiom yang sama dengan ProductForm dan ProjectForm: checkbox yang tidak
  // dicentang tidak ada di FormData, jadi keadaan pulihnya dibaca dari
  // `state.values`, bukan dari record.
  const checked = (name: string, fallback: boolean) =>
    state.values ? state.values[name] === "on" : fallback;

  return (
    <form action={formAction}>
      <AdminSelect
        name="status"
        label="Status"
        options={["DRAFT", "PUBLISHED"]}
        defaultValue={v("status", status)}
      />
      <AdminCheckbox
        name="featured"
        label="Featured"
        defaultChecked={checked("featured", featured)}
      />
      <AdminCheckbox
        name="pwywEnabled"
        label="Pay what you want"
        defaultChecked={checked("pwywEnabled", pwywEnabled)}
      />
      <button type="submit">Save</button>
    </form>
  );
}

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

const find = <T extends Element>(selector: string) =>
  container.querySelector<T>(selector)!;

const submit = async () => {
  await act(async () => {
    find<HTMLFormElement>("form").requestSubmit();
  });
};

describe("admin form controls after a rejected server action", () => {
  /**
   * Regresi: select tak terkendali tidak pernah menerima `defaultValue` baru
   * setelah ter-mount, jadi form.reset() milik React mengembalikannya ke opsi
   * saat mount. Akibatnya pemilik situs memperbaiki field yang ditandai, menyimpan,
   * dan produknya diam-diam tersimpan sebagai DRAFT.
   */
  it("keeps the submitted status in the select, not the one it mounted with", async () => {
    await act(async () => {
      root.render(<Harness status="DRAFT" />);
    });

    find<HTMLSelectElement>('select[name="status"]').value = "PUBLISHED";
    await submit();

    expect(find<HTMLSelectElement>('select[name="status"]').value).toBe(
      "PUBLISHED",
    );
  });

  it("keeps it across a second rejection, and follows a change back to DRAFT", async () => {
    await act(async () => {
      root.render(<Harness status="DRAFT" />);
    });

    find<HTMLSelectElement>('select[name="status"]').value = "PUBLISHED";
    await submit();
    await submit();
    expect(find<HTMLSelectElement>('select[name="status"]').value).toBe(
      "PUBLISHED",
    );

    find<HTMLSelectElement>('select[name="status"]').value = "DRAFT";
    await submit();
    expect(find<HTMLSelectElement>('select[name="status"]').value).toBe(
      "DRAFT",
    );
  });

  it("restores a checkbox that was ticked and leaves an untouched one alone", async () => {
    await act(async () => {
      root.render(<Harness featured={false} pwywEnabled={false} />);
    });

    find<HTMLInputElement>('input[name="featured"]').checked = true;
    await submit();

    expect(find<HTMLInputElement>('input[name="featured"]').checked).toBe(true);
    expect(find<HTMLInputElement>('input[name="pwywEnabled"]').checked).toBe(
      false,
    );
  });

  it("lets an unticked checkbox stay off even when the saved record had it on", async () => {
    await act(async () => {
      root.render(<Harness featured={true} />);
    });

    find<HTMLInputElement>('input[name="featured"]').checked = false;
    await submit();

    expect(find<HTMLInputElement>('input[name="featured"]').checked).toBe(
      false,
    );
  });
});
