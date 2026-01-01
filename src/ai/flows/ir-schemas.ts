/**
 * @fileOverview Schemas and types for the Information Retrieval flow.
 * This file does not use 'use server' and can be safely imported into client components.
 */

import { z } from 'zod';

export const IrInputSchema = z.object({
  methodId: z.string().describe("The ID of the IR method to use."),
  query: z.string().describe("The user's query."),
  documents: z.string().describe("The document corpus, with each document separated by a newline."),
});
export type IrInput = z.infer<typeof IrInputSchema>;

const MatchSchema = z.object({
  docId: z.number(),
  name: z.string(),
  content: z.string(),
  highlights: z.array(z.array(z.number())),
});

const RankedDocSchema = z.object({
  docId: z.number(),
  name: z.string(),
  score: z.number(),
  content: z.string(),
});

const MatchedDocSchema = z.object({
    docId: z.number(),
    name: z.string(),
    content: z.string(),
});

const ClusterSchema = z.object({
  docId: z.number(),
  name: z.string(),
  content: z.string(),
});

export const IrOutputSchema = z.object({
  message: z.string().optional(),
  error: z.string().optional(),
  matches: z.array(MatchSchema).optional(),
  rankedDocuments: z.array(RankedDocSchema).optional(),
  matchedDocuments: z.array(MatchedDocSchema).optional(),
  clusters: z.record(z.string(), z.array(ClusterSchema)).optional(),
  numClusters: z.number().optional(),
}).describe("The result of the IR simulation.");
export type IrOutput = z.infer<typeof IrOutputSchema>;
