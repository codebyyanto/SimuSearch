# SimuSearch Studio

SimuSearch Studio adalah platform simulasi interaktif untuk mempelajari berbagai metode *Information Retrieval* (IR). Proyek ini menggabungkan antarmuka modern berbasis **Next.js** dengan kekuatan pemrosesan teks **Python**.

## Tech Stack

### Frontend (User Interface)
- **Framework**: [Next.js](https://nextjs.org/) (React)
- **Bahasa**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **Ikon**: Lucide React
- **Fitur UI**: Glassmorphism, Animasi Kustom, Responsif.

### Backend (Logic & Processing)
- **Framework**: Python Flask
- **NLP**: Sastrawi (Stemming Bahasa Indonesia)
- **Algoritma**: 
    - Scikit-learn (TF-IDF, Cosine Similarity, K-Means)
    - rank-bm25 (BM25 Okapi)
    - Standard Library (Regex)

## Fitur & Metode IR

Aplikasi ini mendukung simulasi mendalam untuk metode-metode berikut:

1.  **Regex (Regular Expression)**
    *   Pencarian pola teks presisi.
    *   Cocok untuk mencari format tertentu (email, tanggal, kode) atau kata kunci eksak.
    *   Menampilkan *highlight* posisi kecocokan dalam teks.

2.  **Boolean Search**
    *   Mendukung operator logika: `AND`, `OR`, `NOT`.
    *   Contoh query: `(teknologi OR komputer) AND sistem`.
    *   Hasil berupa himpunan dokumen yang memenuhi kriteria logika (tanpa ranking).

3.  **Vector Space Model (VSM)**
    *   Menggunakan pembobotan **TF-IDF** (Term Frequency - Inverse Document Frequency).
    *   Perhitungan kemiripan menggunakan **Cosine Similarity**.
    *   Menghasilkan peringkat dokumen berdasarkan skor relevansi (0.0 - 1.0).

4.  **BM25 (Best Matching 25)**
    *   Algoritma *state-of-the-art* probabilistik untuk ranking dokumen.
    *   Memperhitungkan frekuensi istilah dan normalisasi panjang dokumen.
    *   Lebih akurat dibanding VSM standar untuk korpus dokumen dengan panjang bervariasi.

5.  **K-Means Clustering**
    *   Mengelompokkan dokumen ke dalam *cluster* berdasarkan kemiripan konten.
    *   Menggunakan vektor TF-IDF sebagai fitur input.
    *   Pengguna dapat menentukan jumlah cluster (K) yang diinginkan.

---

## Struktur Proyek

Berikut adalah gambaran struktur folder utama dalam proyek ini:

```
simusearch-studio/
├── backend/                # Server Python (Logika IR)
│   ├── venv/               # Virtual Environment Python
│   ├── app.py              # Kode utama Flask & Algoritma IR
│   └── requirements.txt    # Daftar pustaka Python 
│
├── src/                    # Client Next.js (Visualisasi)
│   ├── ai/
│   │   └── flows/          # Gateway API ke Backend Python
│   ├── app/                # Pages & Layouts (App Router)
│   ├── components/         # Komponen UI (Card, Input, dll)
│   └── lib/                # Utilities & Helpers
│
├── public/                 # Aset statis (Gambar, Icon)
├── .gitignore              # Konfigurasi Git ignore
├── next.config.ts          # Konfigurasi Next.js
└── tailwind.config.ts      # Konfigurasi Styling
```

---

## Panduan Instalasi & Menjalankan

Karena aplikasi ini menggunakan arsitektur *Client-Server*, Anda perlu menjalankan **dua terminal** secara bersamaan.

### Prasyarat
- Node.js (v18+)
- Python (v3.10+)

### 1. Setup Backend (Python)

Masuk ke folder proyek, lalu buat *virtual environment* dan install dependensi:

```bash
# Windows
python -m venv backend/venv
backend\venv\Scripts\pip install -r backend/requirements.txt
```

### 2. Setup Frontend (Next.js)

Install dependensi Node.js:

```bash
npm install
```

---

### Cara Menjalankan Aplikasi

Buka **DUA** terminal terpisah:

**Terminal 1: Menjalankan Backend**
```bash
# Pastikan Anda berada di root folder proyek
backend\venv\Scripts\python backend/app.py
```
*Tunggu hingga muncul pesan: `Running on http://127.0.0.1:5000`*

**Terminal 2: Menjalankan Frontend**
```bash
npm run dev
```

Buka browser dan akses: **http://localhost:3000**
