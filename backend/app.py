from flask import Flask, request, jsonify
from flask_cors import CORS
import re
import math
import numpy as np

# Pustaka NLP
from Sastrawi.Stemmer.StemmerFactory import StemmerFactory
from Sastrawi.StopWordRemover.StopWordRemoverFactory import StopWordRemoverFactory

# Pustaka Machine Learning & IR
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.cluster import KMeans
from rank_bm25 import BM25Okapi

app = Flask(__name__)
CORS(app) # Aktifkan Cross-Origin Resource Sharing

# ==============================================================================
# 1. INISIALISASI (Tokenisasi, Stemming, Stopwords)
# ==============================================================================

# Inisialisasi Sastrawi sekali saja untuk meningkatkan performa
stemmer_factory = StemmerFactory()
stemmer = stemmer_factory.create_stemmer()

stopword_factory = StopWordRemoverFactory()
stopword_remover = stopword_factory.create_stop_word_remover()

def preprocess_text(text):
    """
    Membersihkan teks: Huruf kecil, Hapus simbol, Hapus stopword, Stemming.
    """
    if not text:
        return []
    
    # 1. Ubah ke huruf kecil
    text = text.lower()
    
    # 2. Hapus karakter non-alfanumerik
    text = re.sub(r'[^a-z0-9\s]', ' ', text)
    
    # 3. Hapus Stopword (Sastrawi)
    text = stopword_remover.remove(text)
    
    # 4. Stemming (Sastrawi)
    text = stemmer.stem(text)
    
    # 5. Tokenisasi
    tokens = text.split()
    return tokens

def preprocess_text_string(text):
    """
    Sama seperti preprocess_text tapi mengembalikan string, bukan list token.
    Berguna untuk input TfidfVectorizer.
    """
    tokens = preprocess_text(text)
    return ' '.join(tokens)

# ==============================================================================
# 2. PENCARIAN REGEX
# ==============================================================================

def search_regex(query, documents):
    """
    Pencarian menggunakan Regular Expression standar Python.
    """
    results = []
    try:
        pattern = re.compile(query, re.IGNORECASE)
        for i, doc in enumerate(documents):
            matches = []
            for m in pattern.finditer(doc['content']):
                matches.append([m.start(), m.end()])
            
            if matches:
                results.append({
                    "docId": i + 1,
                    "name": doc['name'],
                    "content": doc['content'],
                    "highlights": matches
                })
        
        if not results:
             return {"message": "Tidak ada kecocokan yang ditemukan."}
             
        return {"matches": results}
    except re.error as e:
        return {"error": f"Regex Error: {str(e)}"}

# ==============================================================================
# 3. VECTOR SPACE MODEL (TF-IDF & Cosine Similarity)
# ==============================================================================

def search_vsm(query, documents):
    """
    Pencarian VSM menggunakan Scikit-Learn TfidfVectorizer & Cosine Similarity.
    """
    if not documents:
        return {"rankedDocuments": []}

    # Pra-pemrosesan korpus untuk TF-IDF
    corpus = [preprocess_text_string(doc['content']) for doc in documents]
    processed_query = preprocess_text_string(query)
    
    if not processed_query:
        return {"rankedDocuments": []}

    # Pembentukan Vektor TF-IDF
    vectorizer = TfidfVectorizer()
    try:
        tfidf_matrix = vectorizer.fit_transform(corpus)
        query_vec = vectorizer.transform([processed_query])
    except ValueError:
        # Terjadi jika kosakata kosong setelah pra-pemrosesan
        return {"rankedDocuments": []}

    # Hitung Kemiripan (Cosine Similarity)
    cosine_sim = cosine_similarity(query_vec, tfidf_matrix).flatten()
    
    # Urutkan Hasil
    ranked_indices = cosine_sim.argsort()[::-1]
    
    results = []
    for idx in ranked_indices:
        score = cosine_sim[idx]
        if score > 0:
            results.append({
                "docId": idx + 1,
                "name": documents[idx]['name'],
                "content": documents[idx]['content'],
                "score": float(score)
            })
            
    return {"rankedDocuments": results}

# ==============================================================================
# 4. BM25 (Best Matching 25)
# ==============================================================================

def search_bm25(query, documents):
    """
    Pencarian menggunakan algoritma BM25Okapi dari pustaka rank_bm25.
    """
    if not documents:
        return {"rankedDocuments": []}

    tokenized_corpus = [preprocess_text(doc['content']) for doc in documents]
    tokenized_query = preprocess_text(query)
    
    if not tokenized_query:
        return {"rankedDocuments": []}

    bm25 = BM25Okapi(tokenized_corpus)
    doc_scores = bm25.get_scores(tokenized_query)
    
    # Urutkan hasil secara manual berdasarkan skor
    ranked_results = []
    for i, score in enumerate(doc_scores):
        if score > 0:
            ranked_results.append({
                "docId": i + 1,
                "name": documents[i]['name'],
                "content": documents[i]['content'],
                "score": float(score)
            })
            
    # Urutkan menurun
    ranked_results.sort(key=lambda x: x['score'], reverse=True)
    
    return {"rankedDocuments": ranked_results}

# ==============================================================================
# 5. PENCARIAN BOOLEAN
# ==============================================================================

def search_boolean(query, documents):
    """
    Pencarian Boolean sederhana (AND, OR, NOT).
    Menggunakan logika irisan/gabungan himpunan pada indeks dokumen.
    """
    # 1. Pengindeksan sederhana (Inverted Index)
    inverted_index = {}
    for i, doc in enumerate(documents):
        tokens = set(preprocess_text(doc['content']))
        for token in tokens:
            if token not in inverted_index:
                inverted_index[token] = set()
            inverted_index[token].add(i)

    # 2. Parser Query (Sangat Sederhana - Recursive Descent)
    # Mendukung: A AND B, A OR B, NOT A, (A OR B)
    # Catatan: Ini implementasi dasar untuk demonstrasi.
    
    tokens = query.replace('(', ' ( ').replace(')', ' ) ').split()
    
    def evaluate_expression(tokens, index_map, all_doc_ids):
        # Implementasi shunting-yard atau evaluator rekursif di Python cukup kompleks.
        # Untuk kesederhanaan migrasi ini, kita gunakan pendekatan set yang lebih aman.
        pass
        
    # Fallback: Menggunakan logika evaluasi manual pada string query
    # Ganti istilah dengan himpunan indeks: "apel" -> {1, 2}
    # Ganti operator: AND -> &, OR -> |, NOT -> - (selisih)
    
    try:
        # Pra-pemrosesan istilah query untuk pencocokan
        processed_query_terms = preprocess_text(query)
        # Catatan: Struktur query boolean (AND/OR) TIDAK boleh di-stem atau dihapus.
        # Jadi kita hanya memproses *istilah*-nya, bukan operatornya.
        
        # Simplifikasi: Kita akan melakukan evaluasi manual pada string query
        
        all_ids = set(range(len(documents)))
        
        # Tokenisasi query dengan mempertahankan operator
        files_map = {} # peta istilah -> himpunan indeks
        
        # Bersihkan query untuk parsing: operator huruf besar, istilah huruf kecil
        # Strategi: Tokenisasi query berdasarkan spasi. Cek apakah token adalah operator. Jika tidak, stem token tersebut.
        
        def safe_eval_boolean(q_str):
            # Pisahkan spasi (pertahankan tanda kurung jika implementasi memungkinkan, tapi split sederhana dulu)
            # Ini adalah implementasi python 'naif' yang mencakup kasus dasar
            
            # Ganti operator kustom dengan operator set python
            # AND -> &
            # OR -> |
            # NOT -> - (TAPI 'NOT A' biasanya 'Semua - A', sedangkan 'A NOT B' adalah 'A - B')
            # Scikit-learn tidak memiliki boolean, jadi butuh logika manual.
            
            # Mari iterasi dokumen dan cek konsistensi dengan ekspresi boolean
            matched_indices = []
            
            # Parse query menjadi ekspresi python yang mengembalikan True/False
            # contoh: "apel AND pisang" -> "('apel' in doc) and ('pisang' in doc)"
            
            # Sanitasi dan siapkan query
            # 1. Lindungi operator
            q = q_str.replace(" AND ", " and ").replace(" OR ", " or ").replace(" NOT ", " not ")
            
            # 2. Regex untuk menemukan istilah (kata yang bukan keyword python)
            # Ini kompleks. Mari iterasi semua dokumen dan cek validitasnya.
            
            for i, doc in enumerate(documents):
                doc_tokens = set(preprocess_text(doc['content']))
                
                # Cek logika
                # Kita ganti setiap kata di query dengan "('kata' in doc_tokens)"
                # Tapi kita harus melewati 'and', 'or', 'not', '(', ')'
                
                parts = q.split()
                eval_parts = []
                for p in parts:
                    p_clean = p.strip()
                    if p_clean.lower() in ['and', 'or', 'not', '(', ')']:
                        eval_parts.append(p_clean.lower())
                    else:
                        # Ini adalah istilah. Lakukan pra-pemrosesan.
                        stemmed_term = preprocess_text_string(p_clean) # mungkin kosong jika stopword
                        if stemmed_term:
                             # Cek jika SALAH SATU token hasil stemming ada (jika frasa) atau kata itu sendiri
                             # Sederhana: cek jika istilah yang di-stem ada di doc_tokens
                             is_present = stemmed_term in doc_tokens
                             eval_parts.append(str(is_present))
                        else:
                             # Istilah terhapus (stopword), asumsikan True (atau diabaikan)?
                             # Asumsikan True agar tidak merusak logika seperti "A AND [stopword]" -> "A AND True"
                             eval_parts.append("True")
                
                condition_str = " ".join(eval_parts)
                try:
                    if eval(condition_str, {"__builtins__": None}, {}):
                         matched_indices.append(i)
                except:
                    continue # Parsing gagal
            
            return matched_indices

        indices = safe_eval_boolean(query)
        
        results = []
        for idx in indices:
            results.append({
                "docId": idx + 1,
                "name": documents[idx]['name'],
                "content": documents[idx]['content']
            })
            
        return {"matchedDocuments": results}

    except Exception as e:
        return {"error": f"Kesalahan Logika Boolean: {str(e)}"}

# ==============================================================================
# 6. CLUSTERING (K-MEANS)
# ==============================================================================

def run_clustering(k_str, documents):
    """
    Clustering menggunakan K-Means dari Scikit-Learn.
    """
    try:
        k = int(k_str)
    except ValueError:
        return {"error": "Jumlah cluster harus berupa angka."}

    if len(documents) < k:
         return {"error": "Jumlah dokumen kurang dari jumlah cluster."}

    # Pra-pemrosesan
    corpus = [preprocess_text_string(doc['content']) for doc in documents]
    
    # TF-IDF
    vectorizer = TfidfVectorizer()
    tfidf_matrix = vectorizer.fit_transform(corpus)
    
    # K-Means
    kmeans = KMeans(n_clusters=k, n_init=10, random_state=42)
    kmeans.fit(tfidf_matrix)
    
    labels = kmeans.labels_
    inertia = kmeans.inertia_
    
    # Kelompokkan hasil
    clusters = {}
    for idx, label in enumerate(labels):
        lbl = str(label)
        if lbl not in clusters:
            clusters[lbl] = []
        
        clusters[lbl].append({
            "docId": idx + 1,
            "name": documents[idx]['name'],
            "content": documents[idx]['content']
        })
        
    return {
        "clusters": clusters,
        "numClusters": k,
        "inertia": float(inertia)
    }

# ==============================================================================
# 7. RUTE FLASK (API ROUTES)
# ==============================================================================

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "sehat", "backend": "Python Flask (Terpadu)"})

@app.route('/api/simulate', methods=['POST'])
def simulate():
    data = request.json
    if not data:
        return jsonify({"error": "Tidak ada data yang diberikan"}), 400
    
    method = data.get('method')
    query = data.get('query')
    documents = data.get('documents', [])
    
    # Normalisasi struktur input dokumen jika diperlukan
    # Pastikan berupa list of {content, name}
    
    if method == 'regex':
        return jsonify(search_regex(query, documents))
    elif method == 'vsm':
        return jsonify(search_vsm(query, documents))
    elif method == 'bm25':
        return jsonify(search_bm25(query, documents))
    elif method == 'boolean':
        return jsonify(search_boolean(query, documents))
    elif method == 'clustering':
        return jsonify(run_clustering(query, documents)) # query bertindak sebagai 'k' disini
    elif method == 'relevance':
        # Relevance feedback biasanya dimulai dengan VSM lalu diperbaiki.
        # Mengembalikan hasil VSM dengan pesan.
        res = search_vsm(query, documents)
        res['message'] = "Relevance Feedback: Peringkat Awal (VSM). Logika perbaikan memerlukan interaksi UI."
        return jsonify(res)
    else:
        return jsonify({"error": f"Metode tidak dikenal: {method}"}), 400

if __name__ == '__main__':
    print("Memulai Backend SimuSearch pada port 5000...")
    app.run(debug=True, port=5000)
