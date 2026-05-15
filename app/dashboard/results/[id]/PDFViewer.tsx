"use client";

import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up the PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFViewerProps {
  file: string;
  pageNumber: number;
  onLoadSuccess: (data: { numPages: number }) => void;
  onLoadError: (error: Error) => void;
  width?: number;
}

export default function PDFViewer({ file, pageNumber, onLoadSuccess, onLoadError, width = 410 }: PDFViewerProps) {
  return (
    <Document
      file={file}
      onLoadSuccess={onLoadSuccess}
      onLoadError={onLoadError}
      loading={
        <div className="p-20 text-brand-sage text-sm font-bold flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-brand-border border-t-brand-teal animate-spin" />
          Loading PDF...
        </div>
      }
    >
      <Page 
        pageNumber={pageNumber} 
        width={width} 
        renderAnnotationLayer={false}
        renderTextLayer={true}
        loading={<div className="bg-brand-muted animate-pulse" style={{ width, height: width * 1.4 }} />}
      />
    </Document>
  );
}
