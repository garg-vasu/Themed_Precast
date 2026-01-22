import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

// Convert hex color to RGB array
const hexToRgb = (hex: string): [number, number, number] => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : [40, 60, 110]; // Default to #283C6E if conversion fails
};

export interface PDFGeneratorOptions {
  title: string;
  headers: string[];
  data: string[][];
  fileName: string;
  successMessage?: string;
  titleFontSize?: number;
  headerColor?: string;
  headerHeight?: number;
  bodyFontSize?: number;
  includeDate?: boolean;
  dateFormat?: string;
  startY?: number;
  alternateRowColor?: [number, number, number];
  margin?: number;
  showToast?: boolean;
}

const defaultOptions: Required<PDFGeneratorOptions> = {
  title: "Report",
  headers: [],
  data: [],
  fileName: `report-${new Date().toISOString().split("T")[0]}.pdf`,
  successMessage: "PDF downloaded successfully",
  titleFontSize: 24,
  headerColor: "#283C6E",
  headerHeight: 10,
  bodyFontSize: 9,
  includeDate: true,
  dateFormat: "Generated on: {date}",
  startY: 40,
  alternateRowColor: [245, 247, 250],
  margin: 14,
  showToast: true,
};

export const generatePDF = (options: PDFGeneratorOptions): void => {
  try {
    const config = { ...defaultOptions, ...options };
    const doc = new jsPDF();

    // Convert hex color to RGB
    const headerRgb = hexToRgb(config.headerColor);

    // Calculate page width for center alignment
    const pageWidth = doc.internal.pageSize.getWidth();

    // Add title - center aligned with bigger font size and bold
    doc.setFontSize(config.titleFontSize);
    // Set font to bold - using type assertion for jsPDF font styles
    (doc as any).setFont("helvetica", "bold");
    const titleWidth = doc.getTextWidth(config.title);
    const titleX = (pageWidth - titleWidth) / 2;
    doc.text(config.title, titleX, 20);
    
    // Reset font to normal for subsequent text
    (doc as any).setFont("helvetica", "normal");

    // Add date if enabled
    if (config.includeDate) {
      doc.setFontSize(10);
      const dateText = config.dateFormat.replace(
        "{date}",
        new Date().toLocaleDateString()
      );
      const dateWidth = doc.getTextWidth(dateText);
      const dateX = (pageWidth - dateWidth) / 2;
      doc.text(dateText, dateX, 30);
    }

    // Add table with custom styling
    autoTable(doc, {
      head: [config.headers],
      body: config.data,
      startY: config.startY,
      styles: {
        fontSize: config.bodyFontSize,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: headerRgb,
        fontSize: config.bodyFontSize + 1,
        textColor: [255, 255, 255], // White text
        fontStyle: "bold",
        cellPadding: {
          top: config.headerHeight / 2,
          bottom: config.headerHeight / 2,
          left: 5,
          right: 5,
        },
        minCellHeight: config.headerHeight,
      },
      alternateRowStyles: {
        fillColor: config.alternateRowColor,
      },
      margin: { left: config.margin, right: config.margin },
    });

    // Save the PDF
    doc.save(config.fileName);

    // Show success toast if enabled
    if (config.showToast) {
      const message = config.successMessage.includes("{count}")
        ? config.successMessage.replace("{count}", String(config.data.length))
        : config.successMessage;
      toast.success(message);
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    if (options.showToast !== false) {
      toast.error("Failed to generate PDF. Please try again.");
    }
    throw error;
  }
};

// Helper function for common use case with row selection validation
export interface GeneratePDFFromTableOptions extends Omit<PDFGeneratorOptions, "data"> {
  selectedRows: any[];
  dataMapper: (row: any) => string[];
  emptySelectionMessage?: string;
}

export const generatePDFFromTable = (options: GeneratePDFFromTableOptions): void => {
  const { selectedRows, dataMapper, emptySelectionMessage, ...pdfOptions } = options;

  if (selectedRows.length === 0) {
    toast.error(emptySelectionMessage || "Please select at least one row to download");
    return;
  }

  const tableData = selectedRows.map(dataMapper);

  generatePDF({
    ...pdfOptions,
    data: tableData,
  });
};
