import { getAuthSession } from "../utils/authSession";

const API_BASE_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "https://noka-backend-production-847d.up.railway.app";

async function readResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    if (contentType.includes("text/html")) {
      throw new Error(
        "Backend sedang tidak tersedia. Periksa status server atau URL tunnel.",
      );
    }

    const detail =
      typeof body === "object" ? body.detail || body.message : body;
    const message = Array.isArray(detail)
      ? detail
          .map((item) => item.msg)
          .filter(Boolean)
          .join(" ")
      : detail;
    const error = new Error(
      message || `Permintaan gagal (HTTP ${response.status}).`,
    );
    error.status = response.status;
    throw error;
  }

  if (!body || typeof body !== "object") {
    throw new Error("Backend mengirim respons yang tidak valid.");
  }

  if (body.error) {
    const errText = String(body.error);
    if (errText.includes("UNIQUE constraint failed: users.email")) {
      throw new Error(
        "Email sudah terdaftar. Silakan gunakan email lain atau masuk.",
      );
    }
    throw new Error(errText);
  }

  return body;
}

async function requestWithQuery(path, params, method = "GET") {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)]),
  );
  const response = await fetch(`${API_BASE_URL}${path}?${query}`, {
    method,
    headers: { Accept: "application/json" },
  });
  return readResponse(response);
}

async function requestWithAuth(path, options = {}) {
  const token = getAuthSession()?.access_token;
  if (!token) {
    throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });
  return readResponse(response);
}

function requireMessage(body, fallback) {
  if (typeof body.message !== "string" || !body.message.trim()) {
    throw new Error(fallback);
  }
  return body;
}

function requireSuccessMessage(body, expectedMessage, fallback) {
  requireMessage(body, fallback);
  if (!body.message.toLocaleLowerCase("id-ID").startsWith(expectedMessage)) {
    throw new Error(body.message);
  }
  return body;
}

function markLoginError(error) {
  const message = String(error.message || "").toLocaleLowerCase("id-ID");

  if (
    message.includes("email atau password salah") ||
    message.includes("email atau kata sandi salah")
  ) {
    error.code = "INVALID_CREDENTIALS";
  } else if (message.includes("akun belum terverifikasi")) {
    error.code = "ACCOUNT_NOT_VERIFIED";
  }

  return error;
}

export async function loginToBackend(email, password) {
  let body;
  try {
    body = requireMessage(
      await requestWithQuery("/login", { email, password }, "POST"),
      "Backend tidak mengirim status login.",
    );
  } catch (error) {
    throw markLoginError(error);
  }

  const message = body.message.toLocaleLowerCase("id-ID");
  if (
    message.includes("email atau password salah") ||
    message.includes("email atau kata sandi salah")
  ) {
    throw markLoginError(new Error(body.message));
  }
  if (message.includes("akun belum terverifikasi")) {
    throw markLoginError(new Error(body.message));
  }

  if (
    typeof body.access_token !== "string" ||
    typeof body.email !== "string" ||
    typeof body.nama !== "string"
  ) {
    throw new Error(
      body.message || "Format respons login backend belum sesuai.",
    );
  }

  return body;
}

export async function registerWithBackend({ nama, email, password }) {
  const body = requireSuccessMessage(
    await requestWithQuery("/register", { nama, email, password }, "POST"),
    "registrasi berhasil",
    "Backend tidak mengirim status registrasi.",
  );
  return body;
}

export async function verifyRegistrationOtp(email, kode) {
  return requireSuccessMessage(
    await requestWithQuery("/verify-otp", { email, kode }, "POST"),
    "otp benar",
    "Backend tidak mengirim status verifikasi.",
  );
}

export async function requestPasswordReset(email) {
  return requireSuccessMessage(
    await requestWithQuery("/forgot-password", { email }, "POST"),
    "otp reset password berhasil dibuat",
    "Backend tidak mengirim status permintaan reset.",
  );
}

export async function verifyPasswordResetOtp(email, kode) {
  return requireSuccessMessage(
    await requestWithQuery("/verify-reset-otp", { email, kode }, "POST"),
    "otp benar",
    "Backend tidak mengirim status verifikasi reset.",
  );
}

export async function resetPassword({ email, password, confirmation }) {
  return requireSuccessMessage(
    await requestWithQuery(
      "/reset-password",
      {
        email,
        password_baru: password,
        konfirmasi_password: confirmation,
      },
      "POST",
    ),
    "password berhasil diubah",
    "Backend tidak mengirim status perubahan kata sandi.",
  );
}

function normalizeTransaction(transaction) {
  const jenis = String(
    transaction.jenis || transaction.tipe || "",
  ).toLocaleLowerCase("id-ID");
  const tipe =
    jenis === "pemasukan" || jenis === "masuk"
      ? "masuk"
      : jenis === "pengeluaran" || jenis === "keluar"
        ? "keluar"
        : null;
  const jumlah = Number(transaction.jumlah);
  const tanggal = String(transaction.tanggal || "").slice(0, 10);

  if (
    !tipe ||
    !Number.isFinite(jumlah) ||
    typeof transaction.keterangan !== "string" ||
    typeof transaction.kategori !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(tanggal)
  ) {
    throw new Error(
      "Backend mengirim data transaksi dengan format yang tidak dikenali.",
    );
  }

  return {
    id: transaction.id,
    tanggal,
    keterangan: transaction.keterangan,
    kategori: transaction.kategori,
    tipe,
    jumlah,
  };
}

function normalizeVoiceCategory(category, text) {
  const value = typeof category === "string" ? category.trim() : "";
  const normalized = value.toLocaleLowerCase("id-ID").replace(/[_-]+/g, " ");

  if (["bahan", "bahan baku"].includes(normalized)) return "bahan baku";
  if (normalized === "kemasan") return "kemasan";
  if (["operasional", "operasional usaha"].includes(normalized))
    return "operasional";
  if (value) return value;

  const speech = text.toLocaleLowerCase("id-ID");
  const categoryRules = [
    {
      category: "bahan baku",
      keywords:
        /\b(beras|telur|ayam|daging|sayur|sayuran|minyak|gula|kopi|susu|tepung|cabai|cabe|bumbu|bahan baku)\b/,
    },
    {
      category: "kemasan",
      keywords:
        /\b(kemasan|plastik|cup|gelas|botol|sedotan|kardus|kotak|paper bag|bungkus|label)\b/,
    },
    {
      category: "operasional",
      keywords:
        /\b(transportasi|bensin|listrik|air|gas|sewa|gaji|internet|ongkir|kebersihan|operasional)\b/,
    },
  ];

  return (
    categoryRules.find(({ keywords }) => keywords.test(speech))?.category || ""
  );
}

export async function getTransactions() {
  const body = await requestWithAuth("/transaksi");
  if (!Array.isArray(body)) {
    throw new Error("Format daftar transaksi backend tidak sesuai.");
  }
  return body.map(normalizeTransaction);
}

export async function createTransaction(transaction) {
  const body = await requestWithAuth("/transaksi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jenis: transaction.tipe === "masuk" ? "pemasukan" : "pengeluaran",
      jumlah: transaction.jumlah,
      kategori: transaction.kategori,
      keterangan: transaction.keterangan,
      tanggal: transaction.tanggal,
    }),
  });
  return requireSuccessMessage(
    body,
    "transaksi berhasil disimpan",
    "Backend tidak mengirim status penyimpanan transaksi.",
  );
}

export async function getBalance() {
  const body = await requestWithAuth("/saldo");
  const balance = {
    totalPemasukan: Number(body.total_pemasukan),
    totalPengeluaran: Number(body.total_pengeluaran),
    saldo: Number(body.saldo),
  };

  if (Object.values(balance).some((value) => !Number.isFinite(value))) {
    throw new Error("Format saldo backend tidak sesuai.");
  }

  return balance;
}

export async function processVoiceAudio(audioBlob, filename) {
  const form = new FormData();
  form.append("file", audioBlob, filename);

  const response = await fetch(`${API_BASE_URL}/proses-suara`, {
    method: "POST",
    headers: { Accept: "application/json" },
    body: form,
  });
  const body = await readResponse(response);

  if (
    typeof body.teks !== "string" ||
    !body.transaksi ||
    typeof body.transaksi !== "object"
  ) {
    throw new Error("Format respons proses suara backend belum sesuai.");
  }

  const jumlah = Number(body.transaksi.jumlah);
  const jenis = body.transaksi.jenis?.toLocaleLowerCase("id-ID");
  const tipe =
    jenis === "pemasukan" || jenis === "masuk"
      ? "masuk"
      : jenis === "pengeluaran" || jenis === "keluar"
        ? "keluar"
        : null;
  const teks = body.teks.trim();
  const keterangan =
    typeof body.transaksi.keterangan === "string"
      ? body.transaksi.keterangan.trim()
      : "";

  if (!tipe || !Number.isFinite(jumlah) || !teks) {
    throw new Error(
      "Data transaksi dari backend belum lengkap atau tidak dikenali.",
    );
  }

  return {
    transcript: teks,
    transaction: {
      tipe,
      jumlah,
      kategori: normalizeVoiceCategory(
        body.transaksi.kategori,
        `${teks} ${keterangan}`,
      ),
      keterangan: keterangan || teks,
    },
  };
}

export async function processTextWithGemini(text) {
  const body = await requestWithQuery("/test-gemini", { text }, "POST");
  const jumlah = Number(body.jumlah);
  const jenis = body.jenis?.toLocaleLowerCase("id-ID");
  const tipe =
    jenis === "pemasukan" || jenis === "masuk"
      ? "masuk"
      : jenis === "pengeluaran" || jenis === "keluar"
        ? "keluar"
        : "masuk";
  const keterangan =
    typeof body.keterangan === "string" && body.keterangan.trim()
      ? body.keterangan.trim()
      : text;
  const kategori =
    typeof body.kategori === "string" ? body.kategori.trim() : "Penjualan";

  if (!Number.isFinite(jumlah) || jumlah <= 0) {
    throw new Error(
      "Jumlah transaksi tidak terdeteksi dari suara. Sebutkan nominalnya dengan jelas.",
    );
  }

  return {
    transcript: text,
    transaction: {
      tipe,
      jumlah,
      kategori: normalizeVoiceCategory(kategori, `${text} ${keterangan}`),
      keterangan,
    },
  };
}
