'use server';
/**
 * @fileOverview Alur (Flow) untuk mensimulasikan berbagai metode Temu Kembali Informasi (Information Retrieval).
 *
 * - simulateIrMethod - Fungsi utama yang menangani proses simulasi.
 */


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
// Basic Indonesian Stemmer (Sastrawi-like Lite)
const stem = (word: string): string => {
    let res = word;
    if (res.length <= 3) return res;
    // Simple prefix removal
    if (res.startsWith('meng')) res = res.slice(4);
    else if (res.startsWith('men')) res = res.slice(3);
    else if (res.startsWith('mem')) res = res.slice(3);
    else if (res.startsWith('me')) res = res.slice(2);
    else if (res.startsWith('peng')) res = res.slice(4);
    else if (res.startsWith('pen')) res = res.slice(3);
    else if (res.startsWith('pem')) res = res.slice(3);
    else if (res.startsWith('di')) res = res.slice(2);
    else if (res.startsWith('ter')) res = res.slice(3);
    else if (res.startsWith('ber')) res = res.slice(3);

    // Simple suffix removal
    if (res.endsWith('kan') && res.length > 5) res = res.slice(0, -3);
    else if (res.endsWith('an') && res.length > 4) res = res.slice(0, -2);
    else if (res.endsWith('i') && res.length > 4) res = res.slice(0, -1);

    return res;
};

const STOPWORDS = new Set([
    // Indonesian
    'dan', 'atau', 'tetapi', 'tapi', 'namun', 'sedangkan', 'melainkan', 'padahal', 'jika', 'bila',
    'kalau', 'supaya', 'agar', 'untuk', 'guna', 'bagi', 'demi', 'karena', 'sebab', 'maka',
    'sehingga', 'sampai', 'hingga', 'yang', 'ini', 'itu', 'pada', 'di', 'ke', 'dari',
    'oleh', 'dengan', 'secara', 'menurut', 'antara', 'adalah', 'ialah', 'merupakan', 'yaitu',
    'yakni', 'seperti', 'bagai', 'bagaikan', 'laksana', 'bak', 'tentang', 'mengenai', 'terhadap',
    'akan', 'sedang', 'telah', 'sudah', 'belum', 'bisa', 'dapat', 'harus', 'wajib', 'mesti',
    'boleh', 'mungkin', 'barangkali', 'pasti', 'tentu', 'tidak', 'bukan', 'jangan', 'sekali',
    'sangat', 'amat', 'paling', 'lebih', 'kurang', 'cukup', 'terlalu', 'hanya', 'cuma', 'saja',
    'lagi', 'pun', 'juga', 'kan', 'lah', 'kah', 'tah', 'ada', 'tiada', 'saya', 'aku',
    'kita', 'kami', 'anda', 'kamu', 'dia', 'mereka', 'apa', 'siapa', 'kapan', 'dimana',
    'mengapa', 'bagaimana', 'berapa',
    // English
    'and', 'or', 'but', 'if', 'then', 'else', 'when', 'at', 'from', 'by', 'for', 'with',
    'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'to', 'of', 'in', 'on', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
    'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'is', 'are', 'was',
    'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'a', 'an', 'the'
]);

/**
 * Memecah teks menjadi token, menghapus stopword, dan melakukan stemming.
 */
const tokenize = (text: string): string[] => {
    return (text.toLowerCase().match(/\b\w+\b/g) || [])
        .filter(token => !STOPWORDS.has(token) && token.length > 1) // Keep short words > 1 char
        .map(stem);
};

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

// ... (Existing TF-IDF and Cosine functions remain unchanged)





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
            while (kursor < teksKueri.length) {
                if (teksKueri.substring(kursor).startsWith(' AND ')) {
                    kursor += 5;
                    const kanan = uraiIstilah();
                    kiri = { op: 'AND', left: kiri, right: kanan };
                } else if (teksKueri.substring(kursor).startsWith(' OR ')) {
                    kursor += 4;
                    const kanan = uraiIstilah();
                    kiri = { op: 'OR', left: kiri, right: kanan };
                } else if (teksKueri.substring(kursor).startsWith(' NOT ')) {
                    // Implicit AND for "A NOT B" -> "A AND NOT B"
                    kursor += 1; // Konsumsi spasi saja, biarkan 'NOT' ditangani uraiIstilah
                    const kanan = uraiIstilah();
                    kiri = { op: 'AND', left: kiri, right: kanan };
                } else {
                    break;
                }
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
/**
 * Melakukan pengelompokan dokumen (Clustering) menggunakan algoritma K-Means dengan TF-IDF dan Cosine Similarity.
 */
// K-Means implementation with explicit return type
interface KMeansResult {
    clusters: { [key: string]: { docId: number, name: string, content: string }[] };
    numClusters: number;
    inertia: number;
}

const runKMeans = (k: number, vektorDokumen: number[][], dokumen: { content: string, name: string }[], semuaToken: string[]): KMeansResult => {
    // 3. Inisialisasi Centroid (K-Means++)
    let centroids: number[][] = [];
    const firstIdx = Math.floor(Math.random() * vektorDokumen.length);
    centroids.push([...vektorDokumen[firstIdx]]);

    while (centroids.length < k) {
        const distances = vektorDokumen.map(vec => {
            let minDistanceSq = Infinity;
            for (const centroid of centroids) {
                const dist = 1 - hitungCosineSimilarity(vec, centroid);
                if (dist < minDistanceSq) minDistanceSq = dist * dist;
            }
            return minDistanceSq;
        });

        const totalDistance = distances.reduce((a, b) => a + b, 0);
        let r = Math.random() * totalDistance;
        let selectedIdx = -1;
        for (let i = 0; i < distances.length; i++) {
            r -= distances[i];
            if (r <= 0) {
                selectedIdx = i;
                break;
            }
        }
        if (selectedIdx === -1) selectedIdx = distances.length - 1;
        centroids.push([...vektorDokumen[selectedIdx]]);
    }

    let assignments = new Array(dokumen.length).fill(0);
    let berubah = true;
    const MAX_ITER = 20;

    for (let iter = 0; iter < MAX_ITER && berubah; iter++) {
        berubah = false;
        vektorDokumen.forEach((vektor, idxDok) => {
            let maxSim = -1; // Cosine Sim ranges -1 to 1 (usually 0 to 1 for TF-IDF)
            let penugasanBaru = 0;
            centroids.forEach((centroid, idxCentroid) => {
                const sim = hitungCosineSimilarity(vektor, centroid);
                if (sim > maxSim) {
                    maxSim = sim;
                    penugasanBaru = idxCentroid;
                }
            });
            if (assignments[idxDok] !== penugasanBaru) {
                assignments[idxDok] = penugasanBaru;
                berubah = true;
            }
        });

        if (berubah) {
            const centroidBaru = Array.from({ length: k }, () => new Array(semuaToken.length).fill(0));
            const hitunganCluster = new Array(k).fill(0);
            vektorDokumen.forEach((vektor, idxDok) => {
                const idxCluster = assignments[idxDok];
                vektor.forEach((val, i) => centroidBaru[idxCluster][i] += val);
                hitunganCluster[idxCluster]++;
            });
            centroids = centroidBaru.map((vec, i) => {
                if (hitunganCluster[i] > 0) return vec.map(val => val / hitunganCluster[i]);
                return centroids[i];
            });
        }
    }

    // Calculate Inertia (Sum of squared distances/errors)
    let inertia = 0;
    vektorDokumen.forEach((vektor, idxDok) => {
        const centroid = centroids[assignments[idxDok]];
        const dist = 1 - hitungCosineSimilarity(vektor, centroid); // Cosine distance
        inertia += dist * dist;
    });

    const clusters: { [key: string]: { docId: number, name: string, content: string }[] } = {};
    assignments.forEach((idxCluster, idxDok) => {
        if (!clusters[idxCluster]) clusters[idxCluster] = [];
        clusters[idxCluster].push({
            docId: idxDok + 1,
            name: dokumen[idxDok].name,
            content: dokumen[idxDok].content
        });
    });

    return { clusters, numClusters: k, inertia };
};

/**
 * Melakukan pengelompokan dokumen (Clustering) menggunakan algoritma K-Means dengan TF-IDF dan Cosine Similarity.
 * Menggunakan "Multi-start" (n_init = 10) untuk hasil terbaik.
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

    // 1. Tokenisasi dan Bangun Vokabulari (with Stemming & improved Stopwords)
    const daftarTokenDokumen = isiDokumen.map(doc => tokenize(doc));
    const semuaToken = [...new Set(daftarTokenDokumen.flat())];

    // 2. Hitung TF-IDF
    const hitungTfidf = () => {
        // Hitung IDF
        const idf: { [key: string]: number } = {};
        semuaToken.forEach(token => {
            const docsWithToken = daftarTokenDokumen.filter(d => d.includes(token)).length;
            idf[token] = Math.log(isiDokumen.length / (1 + docsWithToken));
        });

        // Bangun Vektor TF-IDF untuk setiap dokumen
        return daftarTokenDokumen.map(tokens => {
            const vec = new Array(semuaToken.length).fill(0);
            const tf: { [key: string]: number } = {};
            tokens.forEach(t => tf[t] = (tf[t] || 0) + 1);

            semuaToken.forEach((token, i) => {
                // TF normalisasi
                const valTf = (tf[token] || 0) / tokens.length;
                vec[i] = valTf * idf[token];
            });
            return vec;
        });
    };

    const vektorDokumen = hitungTfidf();

    // 3. Multi-start K-Means
    let bestResult: KMeansResult | null = null;
    const N_INIT = 10; // Jalankan 10 kali

    for (let i = 0; i < N_INIT; i++) {
        const result = runKMeans(k, vektorDokumen, dokumen, semuaToken);
        if (!bestResult || result.inertia < bestResult.inertia) {
            bestResult = result;
        }
    }

    // Return the best result
    const { clusters, numClusters } = bestResult!;
    return { clusters, numClusters };
};


// ============================================================================
// LOGIKA UTAMA (MAIN LOGIC)
// ============================================================================

const jalankanSimulasi = async (input: IrInput): Promise<IrOutput> => {
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
};

/**
 * Fungsi utama untuk memanggil logika simulasi IR.
 */
export async function simulateIrMethod(input: IrInput): Promise<IrOutput> {
    return jalankanSimulasi(input);
}
