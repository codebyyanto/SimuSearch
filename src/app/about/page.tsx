import { Code, Database, Globe, Search, Server, Zap } from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="container mx-auto px-4 py-8 relative min-h-[calc(100vh-4rem)] flex flex-col justify-center">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-primary/20 blur-[120px] rounded-full pointer-events-none -z-10" />

            <section className="max-w-4xl mx-auto space-y-12 animate-in-fade">
                <div className="text-center space-y-4">
                    <h1 className="text-4xl md:text-6xl font-bold font-headline tracking-tight text-gradient pb-2">
                        Tentang SimuSearch
                    </h1>
                    <p className="text-xl text-muted-foreground/80 max-w-2xl mx-auto">
                        Misi kami memudahkan pemahaman konsep Information Retrieval melalui visualisasi interaktif.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 animate-in-slide-up delay-200">
                    <div className="glass-card p-8 rounded-2xl relative overflow-hidden group hover:border-primary/50 transition-colors duration-500">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity animate-float">
                            <Search className="w-32 h-32 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <div className="p-2 bg-primary/20 rounded-lg animate-pulse-slow">
                                <Globe className="w-6 h-6 text-primary" />
                            </div>
                            Apa itu SimuSearch?
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            SimuSearch Studio adalah platform edukasi interaktif yang dirancang khusus untuk mendemistifikasi konsep Information Retrieval.
                            Kami mengubah algoritma kompleks menjadi visualisasi yang mudah dipahami, memungkinkan Anda melihat bagaimana mesin pencari bekerja dari dalam.
                        </p>
                    </div>

                    <div className="glass-card p-8 rounded-2xl relative overflow-hidden group hover:border-accent/50 transition-colors duration-500">
                        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity animate-float animation-delay-2000">
                            <Zap className="w-32 h-32 text-accent" />
                        </div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                            <div className="p-2 bg-accent/20 rounded-lg animate-pulse-slow">
                                <Code className="w-6 h-6 text-accent" />
                            </div>
                            Mengapa Menggunakannya?
                        </h2>
                        <p className="text-muted-foreground leading-relaxed">
                            Belajar teori saja tidak cukup. Dengan SimuSearch, Anda bisa memanipulasi input, melihat proses pembobotan (seperti TF-IDF dan BM25),
                            dan menganalisis hasil ranking secara langsung. Alat bantu sempurna untuk mahasiswa, dosen, dan pengembang software.
                        </p>
                    </div>
                </div>

                <div className="glass p-8 rounded-2xl animate-in-slide-up delay-300">
                    <h3 className="text-xl font-bold mb-6 text-center">Fitur Unggulan</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FeatureItem
                            icon={<Database className="w-6 h-6 text-primary animate-pulse-slow" />}
                            title="Multi-Algoritma"
                            desc="Dukung VSM, Boolean, BM25, hingga Clustering."
                        />
                        <FeatureItem
                            icon={<Zap className="w-6 h-6 text-accent animate-pulse-slow" />}
                            title="Real-time Simulation"
                            desc="Lihat hasil perubahan query dan dokumen seketika."
                        />
                        <FeatureItem
                            icon={<Server className="w-6 h-6 text-indigo-400 animate-pulse-slow" />}
                            title="Code-Free Learning"
                            desc="Pahami logika backend tanpa perlu menulis satu baris kode pun."
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="p-4 rounded-xl bg-background/40 border border-white/5 hover:bg-background/60 transition-all duration-300 hover:scale-105 group cursor-default">
            <div className="mb-3 p-3 bg-secondary/50 rounded-lg w-fit group-hover:bg-primary/20 transition-colors duration-300 shadow-sm group-hover:shadow-primary/20">
                {icon}
            </div>
            <h4 className="font-bold mb-1 group-hover:text-primary transition-colors">{title}</h4>
            <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
    );
}


