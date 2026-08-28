/**
 * Meloloskan teks yang tidak dipercaya sebelum masuk ke badan email HTML.
 *
 * Alamat email pembeli dan judul produk berasal dari luar, dan email HTML tidak
 * punya padanan React yang meloloskan interpolasi dengan sendirinya — string
 * dirangkai dengan tangan. Dipakai bersama oleh email pemberitahuan pemilik dan
 * email tanda terima pembeli supaya keduanya tidak pernah berbeda perlakuan.
 */
export function escapeHtml(value: string): string {
  return value.replace(/[<>&"']/g, (char) => {
    switch (char) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}
