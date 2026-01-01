import type { LucideIcon } from 'lucide-react';
import { ScanSearch, FileText, Binary, RefreshCw, Blocks, Calculator } from 'lucide-react';

export const icons = {
  ScanSearch,
  FileText,
  Binary,
  RefreshCw,
  Blocks,
  Calculator,
} as const;

export type IconName = keyof typeof icons;

export type Method = {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: IconName;
  longDescription: string;
  apiEndpoint: string;
  placeholders: {
    query: string;
    documents: string;
  };
};

export const methods: Method[] = [
  {
    id: 'regex',
    title: 'Pencarian Regex',
    description: 'Pencocokan teks berbasis pola.',
    path: '/metode/regex',
    icon: 'ScanSearch',
    longDescription: 'Melakukan pencarian menggunakan ekspresi reguler untuk menemukan pola spesifik dalam kumpulan dokumen. Hasil akan menyorot kecocokan yang ditemukan.',
    apiEndpoint: '/regex/search',
    placeholders: {
      query: 'cth: info\\w+',
      documents: 'Tempel satu atau lebih dokumen di sini. Setiap dokumen di baris baru atau dipisahkan oleh pembatas yang jelas.',
    },
  },
  {
    id: 'vsm',
    title: 'Vector Space Model',
    description: 'Memberi peringkat dokumen berdasarkan relevansi.',
    path: '/metode/vsm',
    icon: 'FileText',
    longDescription: 'Merepresentasikan dokumen dan kueri sebagai vektor dalam ruang multi-dimensi. Ini memberi peringkat dokumen berdasarkan kesamaan kosinus antara vektor kueri dan vektor dokumen.',
    apiEndpoint: '/vsm/rank',
    placeholders: {
      query: 'cth: keamanan aplikasi web',
      documents: 'Tempel beberapa dokumen di sini. VSM bekerja paling baik dengan korpus beberapa dokumen untuk dibandingkan.',
    },
  },
  {
    id: 'boolean',
    title: 'Retrieval Boolean',
    description: 'Kueri dengan AND, OR, NOT.',
    path: '/metode/boolean',
    icon: 'Binary',
    longDescription: 'Mengambil dokumen berdasarkan logika boolean yang ketat. Gunakan operator seperti AND, OR, dan NOT untuk menggabungkan kata kunci dan memfilter hasil secara presisi.',
    apiEndpoint: '/boolean/query',
    placeholders: {
      query: 'cth: react AND (nextjs OR gatsby) NOT angular',
      documents: 'Tempel korpus dokumen Anda di sini. Retrieval boolean akan memeriksa ada atau tidaknya istilah kueri di setiap dokumen.',
    },
  },
  {
    id: 'relevance',
    title: 'Umpan Balik Relevansi',
    description: 'Sempurnakan hasil dengan umpan balik pengguna.',
    path: '/metode/relevance',
    icon: 'RefreshCw',
    longDescription: "Proses berulang yang menyempurnakan hasil pencarian berdasarkan umpan balik pengguna. Setelah pencarian awal, Anda dapat menandai dokumen sebagai 'relevan' atau 'tidak relevan' untuk meningkatkan iterasi pencarian berikutnya.",
    apiEndpoint: '/relevance/refine',
    placeholders: {
      query: 'cth: model machine learning',
      documents: 'Sediakan satu set dokumen untuk pencarian awal dan putaran umpan balik.',
    },
  },
  {
    id: 'clustering',
    title: 'Clustering Dokumen',
    description: 'Kelompokkan dokumen serupa.',
    path: '/metode/clustering',
    icon: 'Blocks',
    longDescription: 'Secara otomatis mengelompokkan dokumen serupa ke dalam cluster menggunakan algoritma K-Means. Ini berguna untuk menemukan topik dan struktur dalam koleksi dokumen tanpa kueri.',
    apiEndpoint: '/cluster/generate',
    placeholders: {
      query: 'Masukkan jumlah cluster (cth: 3). Ini bukan kueri pencarian.',
      documents: 'Tempel koleksi dokumen yang akan di-cluster. Lebih banyak dokumen menghasilkan cluster yang lebih bermakna.',
    },
  },
  {
    id: 'bm25',
    title: 'Peringkat BM25',
    description: 'Model peringkat probabilistik.',
    path: '/metode/bm25',
    icon: 'Calculator',
    longDescription: 'Fungsi peringkat probabilistik yang digunakan oleh mesin pencari untuk memberi peringkat dokumen sesuai dengan relevansinya dengan kueri tertentu. Ini meningkatkan TF-IDF dengan mempertimbangkan panjang dokumen dan saturasi istilah.',
    apiEndpoint: '/bm25/rank',
    placeholders: {
      query: 'cth: manfaat rendering sisi server',
      documents: 'Tempel korpus dokumen. BM25 akan memberi peringkat berdasarkan kueri Anda.',
    },
  },
];
