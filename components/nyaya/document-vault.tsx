"use client"

import * as React from "react"
import { FileText, UploadCloud, FileSearch, CheckCircle2, AlertCircle, Clock, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export interface VaultDocument {
  id: string;
  title: string;
  type: string;
  uploadDate: string;
  status: 'processed' | 'processing' | 'issue';
  entitiesExtracted: number;
}

interface DocumentVaultProps {
  documents?: VaultDocument[];
  onUpload?: () => void;
  onViewDocument?: (doc: VaultDocument) => void;
  className?: string;
}

const defaultDocuments: VaultDocument[] = [
  {
    id: "doc-1",
    title: "Employment Contract.pdf",
    type: "Contract",
    uploadDate: "2026-08-12",
    status: "processed",
    entitiesExtracted: 14,
  },
  {
    id: "doc-2",
    title: "Termination Letter.pdf",
    type: "Notice",
    uploadDate: "2026-08-14",
    status: "processing",
    entitiesExtracted: 0,
  }
];

export function DocumentVault({ documents = defaultDocuments, onUpload, onViewDocument, className = "" }: DocumentVaultProps) {
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <FileSearch className="h-5 w-5 text-primary" />
            Legal Document Vault
          </CardTitle>
          <CardDescription>Securely store and analyze evidence</CardDescription>
        </div>
        <Button onClick={onUpload} size="sm" className="gap-2">
          <UploadCloud className="h-4 w-4" />
          <span className="hidden sm:inline">Upload Document</span>
        </Button>
      </CardHeader>
      <CardContent>
        {documents.length > 0 ? (
          <div className="space-y-4 mt-4">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                onClick={() => onViewDocument?.(doc)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 p-2 bg-primary/10 rounded-md">
                    <FileText className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{doc.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{doc.type}</span>
                      <span>•</span>
                      <span>{doc.uploadDate}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {doc.status === 'processed' && (
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 flex items-center">
                      <CheckCircle2 className="h-3 w-3" />
                      Processed
                    </Badge>
                  )}
                  {doc.status === 'processing' && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 gap-1 flex items-center">
                      <Clock className="h-3 w-3 animate-pulse" />
                      Processing
                    </Badge>
                  )}
                  {doc.status === 'issue' && (
                    <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 gap-1 flex items-center">
                      <AlertCircle className="h-3 w-3" />
                      Issue Detected
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">No Documents Uploaded</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mb-4">
              Upload your legal documents, contracts, or notices to automatically extract entities and find conflicts.
            </p>
            <Button onClick={onUpload} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Document
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
