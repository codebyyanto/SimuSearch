# Deskripsi Lengkap Website: SimuSearch Studio

## Ringkasan Proyek
**SimuSearch Studio** adalah platform web interaktif yang dirancang sebagai simulator untuk memahami berbagai metode *Information Retrieval* (Temu Kembali Informasi). Website ini menyediakan lingkungan visual dan eksperimental bagi pengguna untuk mempelajari bagaimana mesin pencari memproses kueri dan memberi peringkat dokumen menggunakan berbagai algoritma standar industri.

Dibangun dengan teknologi web modern, SimuSearch Studio menawarkan antarmuka yang responsif, estetis dengan tema "Modern Tech" (Glassmorphism), dan pengalaman pengguna yang mulus.

---

## Fitur Utama

Website ini mencakup simulasi untuk metode-metode berikut:

### 1. Pencarian Regex (Regex Search)
*   **Fungsi**: Melakukan pencarian pola teks mentah menggunakan *Regular Expressions*.
*   **Kegunaan**: Berguna untuk pencocokan string yang presisi, validasi format, dan pencarian pola spesifik (misal: email, tanggal).
*   **Visualisasi**: Menyorot (highlight) teks yang cocok dengan pola secara langsung.

### 2. Vector Space Model (VSM)
*   **Fungsi**: Merepresentasikan dokumen dan kueri sebagai vektor dalam ruang multi-dimensi.
*   **Mekanisme**: Menghitung skor relevansi berdasarkan *Cosine Similarity* antara vektor kueri dan dokumen.
*   **Kegunaan**: Memberikan peringkat dokumen berdasarkan seberapa mirip isinya dengan kueri.

### 3. Boolean Retrieval
*   **Fungsi**: Model pencarian klasik menggunakan logika Boolean.
*   **Operator**: Mendukung `AND`, `OR`, dan `NOT`.
*   **Kegunaan**: Filter hasil yang ketat (biner: relevan atau tidak relevan) berdasarkan keberadaan kata kunci.

### 4. Umpan Balik Relevansi (Relevance Feedback)
*   **Fungsi**: Sistem pencarian iteratif yang belajar dari input pengguna.
*   **Alur Kerja**: Pengguna melakukan pencarian awal, menandai hasil sebagai "relevan" atau "tidak", dan sistem menyempurnakan hasil di putaran berikutnya (Rocchio Algorithm atau serupa).

### 5. Clustering Dokumen
*   **Fungsi**: Mengelompokkan dokumen-dokumen yang memiliki kemiripan konten tanpa memerlukan kueri pencarian.
*   **Algoritma**: Menggunakan *K-Means Clustering*.
*   **Kegunaan**: Analisis topik, organisasi otomatis dokumen, dan eksplorasi data.

### 6. Peringkat BM25 (Best Matching 25)
*   **Fungsi**: Model peringkat probabilistik modern yang merupakan pengembangan dari TF-IDF.
*   **Keunggulan**: Mempertimbangkan frekuensi istilah dan menormalisasi berdasarkan panjang dokumen untuk hasil yang lebih akurat dibanding VSM standar.

---

## Teknologi yang Digunakan (Tech Stack)

### Frontend Core
*   **Next.js 15 (App Router)**: Framework React untuk rendering sisi server (SSR) dan routing yang efisien.
*   **React 19**: Library UI modern dengan fitur terbaru.
*   **TypeScript**: Menjamin keamanan tipe data dan pengembangan yang lebih robust.

### Styling & UI
*   **Tailwind CSS**: Framework CSS <i>utility-first</i> untuk styling cepat dan responsif.
*   **Shadcn/UI**: Koleksi komponen UI yang dapat dikustomisasi, dibangun di atas Radix UI (Dialog, Menubar, Slider, dll).
*   **Animations**: Menggunakan `tailwindcss-animate` untuk transisi halus.
*   **Icons**: `lucide-react` untuk ikonografi vektor yang konsisten.

### Utilitas Tambahan
*   **Zod** & **React Hook Form**: Untuk validasi formulir input yang kuat.
*   **Recharts**: (Kemungkinan digunakan) Untuk visualisasi data grafik jika ada.

---

## Struktur Navigasi
*   **Beranda**: Pengenalan proyek dan akses cepat ke kartu metode.
*   **Metode**: Halaman khusus untuk setiap simulasi algoritma.
*   **Bottom Navigation (Mobile)**: Navigasi mudah di perangkat seluler untuk berpindah antara Beranda dan daftar Metode.
