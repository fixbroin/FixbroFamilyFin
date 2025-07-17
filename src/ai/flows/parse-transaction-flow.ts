'use server';
/**
 * @fileOverview A flow for parsing transaction details from a string of text.
 *
 * - parseTransaction - A function that handles parsing a transaction from text.
 * - ParseTransactionInput - The input type for the parseTransaction function.
 * - ParseTransactionOutput - The return type for the parseTransaction function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseTransactionInputSchema = z.object({
  text: z.string().describe('The text transcript from voice input.'),
  categories: z.array(z.string()).describe('A list of available categories to choose from.'),
});
export type ParseTransactionInput = z.infer<typeof ParseTransactionInputSchema>;

const ParseTransactionOutputSchema = z.object({
  amount: z.number().optional().describe('The numeric amount of the transaction.'),
  name: z.string().optional().describe('The name or description of the item/transaction.'),
  categoryName: z.string().optional().describe('The most relevant category for the transaction from the provided list.'),
});
export type ParseTransactionOutput = z.infer<typeof ParseTransactionOutputSchema>;

export async function parseTransaction(input: ParseTransactionInput): Promise<ParseTransactionOutput> {
  return parseTransactionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'parseTransactionPrompt',
  input: {schema: ParseTransactionInputSchema},
  output: {schema: ParseTransactionOutputSchema},
  prompt: `You are an expert at parsing transaction details from unstructured text and categorizing them.
Extract the amount and the name/description from the following text.
The text is a voice transcription and may contain errors.
Ignore currency symbols like 'Rs' or '$'. Just extract the numeric value for the amount.
The name should be the remaining part of the text after extracting the amount.

From the list of available categories below, select the one that best fits the transaction.
If no category seems to be a good match, do not return a value for categoryName.

Available Categories:
{{#each categories}}
- {{this}}
{{/each}}

Text: {{{text}}}`,
});

const parseTransactionFlow = ai.defineFlow(
  {
    name: 'parseTransactionFlow',
    inputSchema: ParseTransactionInputSchema,
    outputSchema: ParseTransactionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    return output!;
  }
);
