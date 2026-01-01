'use client';

import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { Method } from '@/lib/methods';
import { icons } from '@/lib/methods';
import { simulateIrMethod } from '@/ai/flows/information-retrieval-flow';
import type { IrInput, IrOutput } from '@/ai/flows/ir-schemas';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Terminal, Upload, FileText, CheckCircle, Search, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

const FormSchema = z.object({
  query: z.string().min(1, 'Kueri tidak boleh kosong.'),
  documents: z.string().min(1, 'Dokumen tidak boleh kosong.'),
});

type SimulationPageProps = {
  method: Method;
};

const HighlightedText = ({ text, highlights }: { text: string; highlights: number[][] }) => {
  if (!highlights || highlights.length === 0) {
    return <p className="font-mono text-sm whitespace-pre-wrap">{text}</p>;
  }

  const parts = [];
  let lastIndex = 0;

  highlights.sort((a, b) => a[0] - b[0]).forEach(([start, end], i) => {
    if (start > lastIndex) {
      parts.push(text.substring(lastIndex, start));
    }
    parts.push(
      <mark key={i} className="bg-primary/20 px-1 rounded bg-accent text-accent-foreground">
        {text.substring(start, end)}
      </mark>
    );
    lastIndex = end;
  });

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <p className="font-mono text-sm whitespace-pre-wrap">{parts.map((p, i) => <React.Fragment key={i}>{p}</React.Fragment>)}</p>;
};

const ResultsDisplay = ({ methodId, results }: { methodId: string, results: IrOutput }) => {
  if (results.message && (!results.rankedDocuments && !results.matches && !results.matchedDocuments && !results.clusters)) {
    return <Alert><Terminal className="h-4 w-4" /><AlertTitle>Informasi</AlertTitle><AlertDescription>{results.message}</AlertDescription></Alert>;
  }

  if (methodId === 'regex' && results.matches) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Hasil Pencocokan Regex</h3>
        {results.matches.map((match) => (
          <Card key={match.docId}>
            <CardHeader className="p-4">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span>{match.name}</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <HighlightedText text={match.content} highlights={match.highlights} />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if ((methodId === 'vsm' || methodId === 'bm25' || methodId === 'relevance') && results.rankedDocuments) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Dokumen Terperingkat</h3>
        {results.message && <Alert className="mb-4"><Terminal className="h-4 w-4" /><AlertTitle>Catatan</AlertTitle><AlertDescription>{results.message}</AlertDescription></Alert>}
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Peringkat</TableHead>
                <TableHead>Dokumen</TableHead>
                <TableHead className="w-[120px]">Skor</TableHead>
                <TableHead>Teks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.rankedDocuments.map((doc, index) => (
                <TableRow key={doc.docId}>
                  <TableCell className="font-medium text-center align-top">
                    <Badge variant={index < 3 ? "default" : "secondary"} className="text-sm w-8 h-8 flex items-center justify-center rounded-full">
                      {index + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    <div className="font-medium">{doc.name}</div>
                  </TableCell>
                  <TableCell className="font-mono align-top">{doc.score.toFixed(6)}</TableCell>
                  <TableCell className="align-top">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{doc.content}</p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
    )
  }

  if (methodId === 'boolean' && results.matchedDocuments) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Dokumen yang Cocok</h3>
        {results.matchedDocuments.length > 0 ? (
          results.matchedDocuments.map((doc) => (
            <Card key={doc.docId} className="bg-muted/50">
              <CardHeader className="p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span>{doc.name}</span>
                </CardTitle>
                <Badge variant="default"><CheckCircle className="w-3 h-3 mr-1" />Cocok</Badge>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <p className="text-sm text-muted-foreground">{doc.content}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="text-muted-foreground text-center py-4">Tidak ada dokumen yang cocok dengan kueri boolean Anda.</p>
        )}
      </div>
    )
  }

  if (methodId === 'clustering' && results.clusters) {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">{results.numClusters} Kluster Ditemukan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(results.clusters).sort(([a], [b]) => parseInt(a) - parseInt(b)).map(([clusterId, docs]) => (
            <Card key={clusterId}>
              <CardHeader className="p-4">
                <CardTitle className="text-base">Kluster {parseInt(clusterId) + 1}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2">
                {docs.map((doc) => (
                  <div key={doc.docId} className="text-sm text-muted-foreground border-l-2 border-primary pl-3">
                    <p className="font-semibold text-foreground">{doc.name}</p>
                    <p className="truncate">{doc.content}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <pre className="text-sm bg-muted p-4 rounded-md overflow-x-auto">
      {JSON.stringify(results, null, 2)}
    </pre>
  );
}


export function SimulationPage({ method }: SimulationPageProps) {
  const [results, setResults] = useState<IrOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      query: '',
      documents: '',
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengunggah file.');
      }

      const formattedDocs = result.documents.map((doc: { name: string, content: string }) =>
        `--- Document: ${doc.name} ---\n${doc.content}`
      ).join('\n\n');

      const currentDocs = form.getValues('documents');
      const newDocs = currentDocs ? `${currentDocs}\n\n${formattedDocs}` : formattedDocs;
      form.setValue('documents', newDocs, { shouldValidate: true });

      toast({
        title: 'Sukses',
        description: `${files.length} file berhasil diunggah dan diproses.`,
      });

    } catch (e: any) {
      setError(e.message || 'Gagal memproses file.');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e.message || 'Gagal memproses file.',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const input: IrInput = {
        methodId: method.id,
        query: data.query,
        documents: data.documents,
      };

      const resultData = await simulateIrMethod(input);

      if (resultData.error) {
        throw new Error(resultData.error);
      }

      setResults(resultData);

    } catch (e: any) {
      setError(e.message || 'Terjadi kesalahan tak terduga.');
    } finally {
      setIsLoading(false);
    }
  };

  const queryIsNumberInput = method.id === 'clustering';
  const Icon = icons[method.icon];

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex items-center gap-4">
          <div className="bg-secondary p-4 rounded-lg">
            <Icon className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-headline">{method.title}</h1>
            <p className="mt-1 text-muted-foreground max-w-3xl">{method.longDescription}</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <Card>
          <CardHeader>
            <CardTitle>Input Simulasi</CardTitle>
            <CardDescription>Berikan kueri dan dokumen Anda untuk menjalankan simulasi.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="query"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{queryIsNumberInput ? 'Jumlah Cluster' : 'Kueri'}</FormLabel>
                      <FormControl>
                        {queryIsNumberInput ? (
                          <Input type="number" placeholder={method.placeholders.query} {...field} />
                        ) : (
                          <Textarea placeholder={method.placeholders.query} {...field} />
                        )}
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documents"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex justify-between items-center">
                        <FormLabel>Dokumen</FormLabel>
                        <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                          {isUploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="mr-2 h-4 w-4" />
                          )}
                          Unggah File
                        </Button>
                        <Input
                          type="file"
                          multiple
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".txt,.pdf,.docx"
                        />
                      </div>
                      <FormControl>
                        <Textarea
                          placeholder={method.placeholders.documents}
                          className="min-h-[200px] font-mono text-sm"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isLoading || isUploading} className="w-full bg-accent hover:bg-accent/90">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Mensimulasikan...
                    </>
                  ) : (
                    'Jalankan Simulasi'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:sticky lg:top-24">
          <CardHeader>
            <CardTitle>Hasil</CardTitle>
            <CardDescription>Keluaran dari simulasi akan muncul di sini.</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px] max-h-[70vh] overflow-y-auto">
            {isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
                <p>Memproses...</p>
              </div>
            )}
            {error && !isUploading && (
              <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {results && !isLoading && !error && (
              <ResultsDisplay methodId={method.id} results={results} />
            )}
            {!isLoading && !error && !results && (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground p-8">
                <p>Hasil akan ditampilkan di sini setelah menjalankan simulasi.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
