'use client';

import { ExternalLink, Code, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@wpai-chatbot/dashboard/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@wpai-chatbot/dashboard/components/ui/dialog';
import {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
} from '@wpai-chatbot/dashboard/components/ui/tabs';
import { parseRetrievalResult } from '@wpai-chatbot/dashboard/lib/retrieval-parser';
import { Badge } from '@wpai-chatbot/dashboard/components/ui/badge';

interface RetrievalDialogProps {
	retrievalResult?: string;
}

export function RetrievalDialog({ retrievalResult }: RetrievalDialogProps) {
	if (!retrievalResult) {
		return <span className="text-slate-400">No data</span>;
	}

	// Helper to format JSON string
	const formatJSON = (jsonString: string) => {
		try {
			const parsed = JSON.parse(jsonString);
			return JSON.stringify(parsed, null, 2);
		} catch {
			return jsonString;
		}
	};

	const parsedResult = parseRetrievalResult(retrievalResult);

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button
					variant="ghost"
					size="sm"
					className="flex items-center gap-1"
				>
					View <ExternalLink className="h-3 w-3" />
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
				<DialogHeader>
					<DialogTitle>Retrieval Result</DialogTitle>
				</DialogHeader>

				<Tabs defaultValue="parsed">
					<TabsList className="grid w-[200px] grid-cols-2 mb-4 space-x-2">
						<TabsTrigger
							value="parsed"
							className="flex items-center gap-1"
						>
							<FileText className="h-4 w-4" /> Parsed
						</TabsTrigger>
						<TabsTrigger
							value="raw"
							className="flex items-center gap-1"
						>
							<Code className="h-4 w-4" /> Raw JSON
						</TabsTrigger>
					</TabsList>

					<TabsContent value="parsed">
						{parsedResult ? (
							<div className="space-y-6">
								<div className="space-y-2">
									<h3 className="text-lg font-semibold">
										Query
									</h3>
									<p className="text-sm bg-slate-50 p-3 rounded-md">
										{parsedResult.question}
									</p>
								</div>

								<div className="space-y-3">
									<h3 className="text-lg font-semibold">
										Search Metadata
									</h3>
									<div className="grid grid-cols-2 gap-2 text-sm">
										<div className="bg-slate-50 p-2 rounded-md">
											<span className="font-medium">
												Semantic Query:
											</span>{' '}
											{
												parsedResult.searchMetadata
													.usedSemanticQuery
											}
										</div>
										<div className="bg-slate-50 p-2 rounded-md">
											<span className="font-medium">
												Keyword Query:
											</span>{' '}
											{
												parsedResult.searchMetadata
													.usedKeywordQuery
											}
										</div>
										<div className="bg-slate-50 p-2 rounded-md">
											<span className="font-medium">
												Total Candidates:
											</span>{' '}
											{
												parsedResult.searchMetadata
													.totalCandidates
											}
										</div>
										<div className="bg-slate-50 p-2 rounded-md">
											<span className="font-medium">
												Semantic Weight:
											</span>{' '}
											{
												parsedResult.searchMetadata
													.semanticWeight
											}
										</div>
										<div className="bg-slate-50 p-2 rounded-md">
											<span className="font-medium">
												Keyword Weight:
											</span>{' '}
											{
												parsedResult.searchMetadata
													.keywordWeight
											}
										</div>
									</div>
								</div>

								<div className="space-y-4">
									<h3 className="text-lg font-semibold">
										Related Documents (
										{parsedResult.numResults})
									</h3>

									{parsedResult.related_documents.map(
										(doc, index) => (
											<div
												key={index}
												className="border rounded-md p-4 space-y-3"
											>
												<div className="flex justify-between items-start">
													<h4 className="font-medium">
														<a
															href={
																doc.source_url
															}
															target="_blank"
															rel="noopener noreferrer"
															className="text-blue-600 hover:underline flex items-center gap-1"
														>
															{doc.title ||
																'Document ' +
																	(index + 1)}
															<ExternalLink className="h-3 w-3" />
														</a>
													</h4>
													<div className="flex items-center gap-2">
														<Badge variant="outline">
															{doc.type ||
																'unknown'}
														</Badge>
														{doc.date && (
															<span className="text-xs text-gray-500">
																{format(
																	new Date(
																		doc.date,
																	),
																	'MMM d, yyyy',
																)}
															</span>
														)}
													</div>
												</div>

												{doc.excerpt && (
													<p className="text-sm text-gray-600 italic">
														{doc.excerpt}
													</p>
												)}

												<div className="bg-slate-50 p-3 rounded-md text-sm overflow-auto max-h-32">
													{doc.text}
												</div>
											</div>
										),
									)}
								</div>
							</div>
						) : (
							<div className="p-4 bg-red-50 text-red-600 rounded-md">
								Unable to parse retrieval result
							</div>
						)}
					</TabsContent>

					<TabsContent value="raw">
						<pre className="bg-slate-50 p-4 rounded-md overflow-auto text-sm">
							{formatJSON(retrievalResult)}
						</pre>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	);
}
