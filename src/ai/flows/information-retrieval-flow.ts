'use server';
/**
 * @fileOverview Alur (Flow) untuk mensimulasikan berbagai metode Temu Kembali Informasi (Information Retrieval).
 *
 * - simulateIrMethod - Fungsi utama yang menangani proses simulasi.
 */

import { ai } from '@/ai/genkit';
import { IrInputSchema, IrOutputSchema, type IrInput, type IrOutput } from './ir-schemas';

// ============================================================================
// UTILITAS UMUM (GENERAL UTILITIES)
// ============================================================================

/**
 * Memecah teks menjadi token (kata-kata dasar).
 * Mengubah ke huruf kecil dan hanya mengambil karakter alfanumerik.
 * @param text Teks yang akan ditokenisasi.
 * @returns Array string berisi token.
 */
const tokenize = (text: string): string[] =>
    text.toLowerCase().match(/\b\w+\b/g) || [];

/**
 * Menghitung kemiripan Cosine antara dua vektor.
 * @param vecA Vektor pertama.
 * @param vecB Vektor kedua.
 * @returns Nilai kemiripan (0 hingga 1).
 */
const hitungCosineSimilarity = (vecA: number[], vecB: number[]) => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] ** 2;
        normB += vecB[i] ** 2;
    }
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Menghitung jarak Euclidean antara dua vektor.
 * @param vecA Vektor pertama.
 * @param vecB Vektor kedua.
 * @returns Jarak Euclidean.
 */
const hitungEuclideanDistance = (vecA: number[], vecB: number[]) =>
    Math.sqrt(vecA.reduce((sum, val, i) => sum + (val - vecB[i]) ** 2, 0));

/**
 * Mengurai string dokumen input menjadi objek metadata.
 * Mendukung format dengan header `--- Document: Nama ---` atau teks biasa.
 * @param documents String dokumen mentah.
 * @returns Array objek dokumen { content, name }.
 */
const ambilMetadataDokumen = (documents: string): { content: string; name: string }[] => {
    const pemisahDokumen = /---\sDocument:\s(.*)?\s---/;
    // Memisahkan berdasarkan baris baru sebelum header dokumen
    const docsWithMetadata = documents.split(/\n(?=---)/).map(d => d.trim()).filter(d => d.length > 0);

    let penghitungIdDokumen = 1;
    const metadata = docsWithMetadata.map(strDokumen => {
        const cocok = strDokumen.match(pemisahDokumen);
        if (cocok && cocok[1]) {
            const nama = cocok[1];
            const konten = strDokumen.replace(pemisahDokumen, '').trim();
            return { content: konten, name: nama };
        }
        // Fallback untuk teks yang dimasukkan secara manual tanpa header
        return { content: strDokumen, name: `Dokumen ${penghitungIdDokumen++}` };
    });

    // Menangani kasus di mana sama sekali tidak ada header dokumen
    if (metadata.every(m => m.name.startsWith('Dokumen'))) {
        penghitungIdDokumen = 1;
        // Coba pisahkan dengan dua baris baru jika tidak ada header
        return documents.split('\n\n')
            .map(d => ({ content: d.trim(), name: `Dokumen ${penghitungIdDokumen++}` }))
            .filter(d => d.content.length > 0);
    }

    return metadata;
};

// ============================================================================
// METODE SEARCH: REGEX
// ============================================================================

/**
 * Melakukan pencarian menggunakan Regular Expression.
 */
const jalankanPencarianRegex = (kueri: string, dokumen: { content: string, name: string }[]) => {
    try {
        const regex = new RegExp(kueri, 'gi');
        const hasil = dokumen.map((doc, i) => {
            const sorotan: [number, number][] = [];
            let match;
            while ((match = regex.exec(doc.content)) !== null) {
                sorotan.push([match.index, match.index + match[0].length]);
            }
            return { docId: i + 1, name: doc.name, content: doc.content, highlights: sorotan };
        }).filter(m => m.highlights.length > 0);

        if (hasil.length === 0) {
            return { message: "Tidak ada kecocokan yang ditemukan untuk ekspresi reguler yang diberikan." };
        }
        return { matches: hasil };
    } catch (e: any) {
        return { error: 'Ekspresi Reguler Tidak Valid: ' + e.message };
    }
};

// ============================================================================
// METODE SEARCH: VSM (Vector Space Model)
// ============================================================================

/**
 * Melakukan pencarian menggunakan Vector Space Model (TF-IDF & Cosine Similarity).
 */
const jalankanPencarianVsm = (kueri: string, dokumen: { content: string, name: string }[]) => {
    const isiDokumen = dokumen.map(d => d.content);
    const tokenKueri = tokenize(kueri);
    const tokenDokumen = isiDokumen.map(doc => tokenize(doc));

    // Gabungkan semua token unik dari kueri dan dokumen
    const semuaToken = [...new Set([...tokenKueri, ...tokenDokumen.flat()])];

    // Helper lokal untuk membangun vektor TF-IDF
    const bangunVektorTfidf = (tokens: string[]) => {
        // Hitung Term Frequency (TF)
        const tf = tokens.reduce((acc, token) => {
            acc[token] = (acc[token] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        // Normalisasi TF
        for (const token in tf) {
            tf[token] /= tokens.length;
        }

        // Hitung Inverse Document Frequency (IDF) dan gabungkan
        const idf = semuaToken.reduce((acc, token) => {
            const docsContainingToken = tokenDokumen.filter(d => d.includes(token)).length;
            acc[token] = Math.log(isiDokumen.length / (1 + docsContainingToken));
            return acc;
        }, {} as { [key: string]: number });

        // Hasilkan vektor
        return semuaToken.map(token => (tf[token] || 0) * (idf[token] || 0));
    };

    const vektorKueri = bangunVektorTfidf(tokenKueri);

    const dokumenTerperingkat = isiDokumen.map((doc, i) => {
        const vektorDokumen = bangunVektorTfidf(tokenDokumen[i]);
        const skor = hitungCosineSimilarity(vektorKueri, vektorDokumen);
        return { docId: i + 1, name: dokumen[i].name, score: skor, content: doc };
    }).sort((a, b) => b.score - a.score); // Urutkan dari skor tertinggi

    return { rankedDocuments: dokumenTerperingkat };
};

// ============================================================================
// METODE SEARCH: BOOLEAN
// ============================================================================

/**
 * Melakukan pencarian menggunakan logika Boolean (AND, OR, NOT).
 */
const jalankanPencarianBoolean = (kueri: string, dokumen: { content: string, name: string }[]) => {
    const isiDokumen = dokumen.map(d => d.content);
    const daftarTokenDokumen = isiDokumen.map(doc => new Set(tokenize(doc)));

    // Fungsi evaluasi rekursif untuk node pohon ekspresi
    const evaluasiNode = (node: any): Set<number> => {
        if (node.term) {
            const term = node.term.toLowerCase();
            const docsCocok = new Set<number>();
            daftarTokenDokumen.forEach((tokens, i) => {
                if (tokens.has(term)) {
                    docsCocok.add(i);
                }
            });
            return docsCocok;
        }
        if (node.op === 'AND') {
            const hasilKiri = evaluasiNode(node.left);
            const hasilKanan = evaluasiNode(node.right);
            return new Set([...hasilKiri].filter(x => hasilKanan.has(x)));
        }
        if (node.op === 'OR') {
            const hasilKiri = evaluasiNode(node.left);
            const hasilKanan = evaluasiNode(node.right);
            return new Set([...hasilKiri, ...hasilKanan]);
        }
        if (node.op === 'NOT') {
            const semuaIndeks = new Set(isiDokumen.map((_, i) => i));
            const hasilKanan = evaluasiNode(node.right);
            return new Set([...semuaIndeks].filter(x => !hasilKanan.has(x)));
        }
        return new Set();
    };

    // Parser kueri boolean
    const uraiKueri = (teksKueri: string) => {
        teksKueri = teksKueri.trim().replace(/\s+/g, ' '); // Normalisasi spasi
        let kursor = 0;

        function uraiEkspresi(): any {
            let kiri = uraiIstilah();
            while (kursor < teksKueri.length && (teksKueri.substring(kursor).startsWith(' AND ') || teksKueri.substring(kursor).startsWith(' OR '))) {
                const op = teksKueri.substring(kursor).startsWith(' AND ') ? 'AND' : 'OR';
                kursor += op.length + 2;
                const kanan = uraiIstilah();
                kiri = { op, left: kiri, right: kanan };
            }
            return kiri;
        }

        function uraiIstilah(): any {
            if (teksKueri.substring(kursor).startsWith('NOT ')) {
                kursor += 4;
                return { op: 'NOT', right: uraiIstilah() };
            }
            if (teksKueri[kursor] === '(') {
                kursor++;
                const expr = uraiEkspresi();
                if (teksKueri[kursor] === ')') {
                    kursor++;
                    return expr;
                }
                throw new Error("Tanda kurung tidak cocok");
            }
            let mulai = kursor;
            // Baca sampai spasi atau tutup kurung
            while (kursor < teksKueri.length && teksKueri[kursor] !== ' ' && teksKueri[kursor] !== ')') {
                kursor++;
            }
            const istilah = teksKueri.substring(mulai, kursor).trim();
            if (!istilah) throw new Error("Istilah kueri kosong ditemukan");
            return { term: istilah };
        }

        try {
            const pohon = uraiEkspresi();
            if (kursor < teksKueri.length) {
                throw new Error(`Karakter tak terduga di akhir kueri: ${teksKueri.substring(kursor)}`);
            }
            return pohon;
        } catch (e: any) {
            throw new Error(`Gagal mengurai kueri boolean: ${e.message}`);
        }
    };

    try {
        const pohonKueri = uraiKueri(kueri);
        const indeksCocok = evaluasiNode(pohonKueri);
        const dokumenCocok = [...indeksCocok].map(index => ({
            docId: index + 1,
            name: dokumen[index].name,
            content: dokumen[index].content
        }));
        return { matchedDocuments: dokumenCocok };
    } catch (e: any) {
        return { error: e.message };
    }
};

// ============================================================================
// METODE SEARCH: BM25
// ============================================================================

/**
 * Melakukan pencarian menggunakan algoritma BM25 (Best Matching 25).
 * @param k1 Parameter saturasi term frequency (default 1.5).
 * @param b Parameter normalisasi panjang dokumen (default 0.75).
 */
const jalankanPencarianBm25 = (kueri: string, dokumen: { content: string, name: string }[], k1 = 1.5, b = 0.75) => {
    const isiDokumen = dokumen.map(d => d.content);
    const tokenKueri = tokenize(kueri);
    const daftarTokenDokumen = isiDokumen.map(doc => tokenize(doc));

    // Rata-rata panjang dokumen
    const rataRataPanjangDok = daftarTokenDokumen.reduce((sum, tokens) => sum + tokens.length, 0) / isiDokumen.length;

    const cacheIdf = new Map<string, number>();

    const hitungIdf = (term: string) => {
        if (cacheIdf.has(term)) return cacheIdf.get(term)!;
        const jumlahDokDenganTerm = daftarTokenDokumen.filter(tokens => tokens.includes(term)).length;
        // Rumus IDF probabilistik standar BM25
        const idf = Math.log(((isiDokumen.length - jumlahDokDenganTerm + 0.5) / (jumlahDokDenganTerm + 0.5)) + 1);
        cacheIdf.set(term, idf);
        return idf;
    };

    const dokumenTerperingkat = isiDokumen.map((doc, i) => {
        const tokenDokumen = daftarTokenDokumen[i];
        let skor = 0;

        tokenKueri.forEach(term => {
            const frekuensiTerm = tokenDokumen.filter(t => t === term).length;
            if (frekuensiTerm > 0) {
                const idf = hitungIdf(term);
                const pembilang = frekuensiTerm * (k1 + 1);
                const penyebut = frekuensiTerm + k1 * (1 - b + b * (tokenDokumen.length / rataRataPanjangDok));
                skor += idf * (pembilang / penyebut);
            }
        });

        return { docId: i + 1, name: dokumen[i].name, score: skor, content: doc };
    }).sort((a, b) => b.score - a.score);

    return { rankedDocuments: dokumenTerperingkat };
};

// ============================================================================
// METODE SEARCH: CLUSTERING (K-MEANS SEDERHANA)
// ============================================================================

/**
 * Melakukan pengelompokan dokumen (Clustering) menggunakan algoritma K-Means sederhana.
 */
const jalankanClustering = (strJumlahCluster: string, dokumen: { content: string, name: string }[]) => {
    const k = parseInt(strJumlahCluster, 10);
    if (isNaN(k) || k <= 0) {
        return { error: "Jumlah cluster harus berupa bilangan bulat positif." };
    }

    const isiDokumen = dokumen.map(d => d.content);
    if (isiDokumen.length < k) {
        return { error: "Jumlah dokumen harus lebih besar atau sama dengan jumlah cluster." };
    }

    const daftarTokenDokumen = isiDokumen.map(doc => tokenize(doc));
    const semuaToken = [...new Set(daftarTokenDokumen.flat())];

    const bangunVektor = (tokens: string[]) => {
        const vektor = new Array(semuaToken.length).fill(0);
        tokens.forEach(token => {
            const index = semuaToken.indexOf(token);
            if (index !== -1) vektor[index]++;
        });
        return vektor;
    };

    const vektorDokumen = daftarTokenDokumen.map(bangunVektor);

    // Inisialisasi Centroid (mengambil k dokumen pertama sebagai centroid awal)
    let centroids = vektorDokumen.slice(0, k);
    let assignments = new Array(isiDokumen.length).fill(0);

    let berubah = true;
    // Iterasi maksimum 20 kali untuk mencegah loop tak terbatas
    for (let iter = 0; iter < 20 && berubah; iter++) {
        berubah = false;

        // Langkah 1: Penugasan (Assignment) ke centroid terdekat
        vektorDokumen.forEach((vektor, idxDok) => {
            let jarakMin = Infinity;
            let penugasanBaru = 0;
            centroids.forEach((centroid, idxCentroid) => {
                const jarak = hitungEuclideanDistance(vektor, centroid);
                if (jarak < jarakMin) {
                    jarakMin = jarak;
                    penugasanBaru = idxCentroid;
                }
            });
            if (assignments[idxDok] !== penugasanBaru) {
                assignments[idxDok] = penugasanBaru;
                berubah = true;
            }
        });

        // Langkah 2: Pembaruan (Update) posisi centroid
        const centroidBaru = Array.from({ length: k }, () => new Array(semuaToken.length).fill(0));
        const hitunganCluster = new Array(k).fill(0);

        vektorDokumen.forEach((vektor, idxDok) => {
            const idxCluster = assignments[idxDok];
            vektor.forEach((val, i) => centroidBaru[idxCluster][i] += val);
            hitunganCluster[idxCluster]++;
        });

        centroidBaru.forEach((centroid, i) => {
            if (hitunganCluster[i] > 0) {
                centroids[i] = centroid.map(val => val / hitunganCluster[i]);
            }
        });
    }

    // Format hasil output
    const clusters: { [key: string]: { docId: number, name: string, content: string }[] } = {};
    assignments.forEach((idxCluster, idxDok) => {
        if (!clusters[idxCluster]) clusters[idxCluster] = [];
        clusters[idxCluster].push({
            docId: idxDok + 1,
            name: dokumen[idxDok].name,
            content: dokumen[idxDok].content
        });
    });

    return { clusters, numClusters: k };
};

// ============================================================================
// DEFINISI GENKIT FLOW
// ============================================================================

const informationRetrievalFlow = ai.defineFlow(
    {
        name: 'informationRetrievalFlow',
        inputSchema: IrInputSchema,
        outputSchema: IrOutputSchema,
    },
    async (input) => {
        const dokumen = ambilMetadataDokumen(input.documents);

        // Validasi dasar
        if (dokumen.length === 0 || dokumen.every(d => !d.content)) {
            return { error: "Harap berikan setidaknya satu dokumen." };
        }

        switch (input.methodId) {
            case 'regex':
                return jalankanPencarianRegex(input.query, dokumen);
            case 'vsm':
                return jalankanPencarianVsm(input.query, dokumen);
            case 'boolean':
                return jalankanPencarianBoolean(input.query, dokumen);
            case 'bm25':
                return jalankanPencarianBm25(input.query, dokumen);
            case 'clustering':
                return jalankanClustering(input.query, dokumen);
            case 'relevance':
                // Umpan balik relevansi (Relevance Feedback) memerlukan beberapa langkah.
                // Di sini kita kembalikan peringkat awal terlebih dahulu (menggunakan VSM).
                return {
                    ...jalankanPencarianVsm(input.query, dokumen),
                    message: "Ini adalah peringkat awal. Di aplikasi nyata, Anda akan memilih dokumen yang relevan untuk menyaring hasil ini lebih lanjut.",
                };
            default:
                return { error: `Metode tidak dikenal: ${input.methodId}` };
        }
    }
);

/**
 * Fungsi wrapper untuk memanggil flow IR.
 * Digunakan untuk integrasi sisi server atau pemanggilan langsung.
 */
export async function simulateIrMethod(input: IrInput): Promise<IrOutput> {
    return informationRetrievalFlow(input);
}
