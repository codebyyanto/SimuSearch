'use server';
/**
 * @fileOverview Alur (Flow) untuk mensimulasikan berbagai metode Temu Kembali Informasi (Information Retrieval).
 */
import { IrInputSchema, IrOutputSchema, type IrInput, type IrOutput } from './ir-schemas';



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



const URL_BACKEND_PYTHON = 'http://localhost:5000/api/simulate';

const jalankanSimulasi = async (input: IrInput): Promise<IrOutput> => {

    const dokumen = ambilMetadataDokumen(input.documents);


    if (dokumen.length === 0 || dokumen.every(d => !d.content)) {
        return { error: "Harap berikan setidaknya satu dokumen." };
    }

    try {

        const response = await fetch(URL_BACKEND_PYTHON, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                method: input.methodId,
                query: input.query,
                documents: dokumen
            }),

        });

        if (!response.ok) {

            let errorMsg = `Backend Error: ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.error) errorMsg = errorData.error;
            } catch (e) { /* ignore json parse error */ }

            throw new Error(errorMsg);
        }

        const data = await response.json();
        return data as IrOutput;

    } catch (error: any) {
        console.error("Gagal menghubungi Backend Python:", error);


        if (error.message.includes('fetch failed')) {
            return {
                error: "Gagal terhubung ke server Backend Python. Pastikan server Flask sudah berjalan di port 5000."
            };
        }
        return { error: error.message || "Terjadi kesalahan internal saat menghubungi backend." };
    }
};

/**
 * Fungsi utama untuk memanggil logika simulasi IR.
 */
export async function simulateIrMethod(input: IrInput): Promise<IrOutput> {
    return jalankanSimulasi(input);
}
