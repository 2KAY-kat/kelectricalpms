import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Plus, FileText, Download, Edit, Trash2, CalendarIcon, Eye } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { documentSchema } from "@/lib/validations";
import { z } from "zod";
import { DocumentEditor } from "@/components/DocumentEditor";
import { DocumentPreview } from "@/components/DocumentPreview";
import { useUserRole } from "@/hooks/useUserRole";
import { ensurePdfFonts, PDF_FONT_FAMILIES } from "@/lib/pdfFonts";
import { cn } from "@/lib/utils";

export default function Documents() {
  const { isEmployee } = useUserRole();
  const [documents, setDocuments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [branding, setBranding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [deleteDoc, setDeleteDoc] = useState<any>(null);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    document_type: "quotation",
    project_id: "",
    document_date: new Date(),
    content: {
      attention_to: "",
      items: [] as any[],
      labor_cost: 0,
      notes: "",
      subtotal: 0,
      tax: 0,
      total: 0,
    },
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [docsResult, projectsResult, brandingResult] = await Promise.all([
      supabase.from("documents").select("*, projects(name)").order("created_at", { ascending: false }),
      supabase.from("projects").select("id, name"),
      supabase.from("company_branding").select("*").limit(1).single(),
    ]);

    if (!docsResult.error) setDocuments(docsResult.data || []);
    if (!projectsResult.error) setProjects(projectsResult.data || []);
    if (!brandingResult.error) setBranding(brandingResult.data);

    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const items = formData.content.items || [];
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
      const total = subtotal + (formData.content.labor_cost || 0);

      const dataToValidate = {
        title: formData.title,
        document_type: formData.document_type,
        content: {
          ...formData.content,
          document_date: formData.document_date.toISOString(),
          subtotal,
          total,
        },
        project_id: formData.project_id || undefined,
      };

      const validatedData = documentSchema.parse(dataToValidate);

      if (editingDoc) {
        const { error } = await supabase
          .from("documents")
          .update(validatedData)
          .eq("id", editingDoc.id);

        if (error) {
          toast.error("Failed to update document");
        } else {
          toast.success("Document updated successfully!");
          setOpen(false);
          setEditingDoc(null);
          resetForm();
          fetchData();
        }
      } else {
        const { error } = await supabase.from("documents").insert([validatedData as any]);

        if (error) {
          toast.error("Failed to create document");
        } else {
          toast.success("Document created successfully!");
          setOpen(false);
          resetForm();
          fetchData();
        }
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error("Invalid input data");
      }
    }
  };

  const handleEdit = (doc: any) => {
    setEditingDoc(doc);
    setFormData({
      title: doc.title,
      document_type: doc.document_type,
      project_id: doc.project_id || "",
      document_date: doc.content?.document_date ? new Date(doc.content.document_date) : new Date(doc.created_at),
      content: {
        attention_to: doc.content?.attention_to || "",
        items: doc.content?.items || [],
        labor_cost: doc.content?.labor_cost || 0,
        notes: doc.content?.notes || "",
        subtotal: doc.content?.subtotal || 0,
        tax: doc.content?.tax || 0,
        total: doc.content?.total || 0,
      },
    });
    setOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteDoc) return;

    const { error } = await supabase.from("documents").delete().eq("id", deleteDoc.id);

    if (error) {
      toast.error("Failed to delete document");
    } else {
      toast.success("Document deleted successfully!");
      setDeleteDoc(null);
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      document_type: "quotation",
      project_id: "",
      document_date: new Date(),
      content: {
        attention_to: "",
        items: [],
        labor_cost: 0,
        notes: "",
        subtotal: 0,
        tax: 0,
        total: 0,
      },
    });
  };

  const generatePDF = async (doc: any) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const pageHeight = pdf.internal.pageSize.height;
    let yPos = 10;
    const isInvoice = doc.document_type === "invoice";
    let pdfFontsLoaded = false;

    try {
      await ensurePdfFonts(pdf);
      pdfFontsLoaded = true;
    } catch (error) {
      console.error("Could not load custom PDF fonts", error);
    }

    // Load header image
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    // Get document date from content or fallback to created_at
    const docDate = doc.content?.document_date ? new Date(doc.content.document_date) : new Date(doc.created_at);
    const dateStr = format(docDate, "dd/MM/yyyy");
    const pxToMm = (px: number) => (px * 25.4) / 96;
    const pxToPt = (px: number) => (px * 72) / 96;
    const ptToMm = (pt: number) => (pt * 25.4) / 72;
    const fontBaselineMm = (fontSizePx: number) => pxToMm(fontSizePx * 0.8);
    const rowTextBaseline = (rowTop: number, rowHeight: number, fontSizePt: number) =>
      rowTop + rowHeight / 2 + ptToMm(fontSizePt) * 0.25;
    const headerMarginX = 12;
    const attentionFontPx = 12;
    const titleFontPx = 16;
    const attentionLineHeightPx = attentionFontPx * 1.2;
    const titleLineHeightPx = titleFontPx * 1.2;
    const previewSectionGapPx = 12;
    const previewAttentionTopPx = 24;
    const previewAttentionIndentPx = 12;
    const formatGroupedNumber = (value: number) => Number(value || 0).toLocaleString("en-US").replace(/,/g, ", ");
    const formatTableAmount = (amount: number) => {
      const [kwacha, tambala] = amount.toFixed(2).split(".");
      return {
        kwacha: formatGroupedNumber(Number(kwacha)),
        tambala,
      };
    };
    const centuryGothicPdfFont = pdfFontsLoaded ? PDF_FONT_FAMILIES.centuryGothic : "helvetica";
    const calibriPdfFont = pdfFontsLoaded ? PDF_FONT_FAMILIES.calibri : "helvetica";

    try {
      // Use the exact header image for consistency
      const headerImg = await loadImage("/images/pdf-header.png");
      // Calculate aspect ratio to fit width
      const headerWidth = pageWidth - 24;
      const headerHeight = headerWidth * (headerImg.height / headerImg.width);
      
      if (isInvoice) {
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("Times New Roman", "bold");
        pdf.text("INVOICE", pageWidth - 70, yPos + 6, { align: "right" });
      }
      
      pdf.addImage(headerImg, "PNG", headerMarginX, yPos, headerWidth, headerHeight);
      
      // Overlay date on the letterhead's date placeholder (top-right of header)
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, "bold");
      pdf.text(`Date: ${dateStr}`, pageWidth - 13, yPos + headerHeight - 18, { align: "right" });
      
      yPos += headerHeight;
    } catch (e) {
      console.log("Could not load header image");
      // Fallback: Draw header manually
      pdf.setFontSize(16);
      pdf.setTextColor(30, 58, 138);
      pdf.setFont(undefined, "bold");
      pdf.text("ELECTRICAL & POWER ENGINEERING", 45, yPos + 8);
      pdf.setFontSize(10);
      pdf.setTextColor(245, 158, 11);
      pdf.setFont(undefined, "italic");
      pdf.text("b e y o n d   e l e c t r i c a l s", 45, yPos + 14);
      
      // Date on right
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, "normal");
      pdf.text(`Date: ${dateStr}`, pageWidth - 15, yPos + 8, { align: "right" });
      
      yPos += 25;
    }

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, "normal");

    // // Thin separator line
    // pdf.setDrawColor(30, 58, 138);
    // pdf.setLineWidth(0.5);
    // pdf.line(12, yPos, pageWidth - 12, yPos);
    // yPos += 8;
    // yPos += 8;

    // Attention To with dotted line
    const attentionTopY = yPos + pxToMm(previewAttentionTopPx);
    const attentionBaselineY = attentionTopY + fontBaselineMm(attentionFontPx);
    const titleTopY = attentionTopY + pxToMm(attentionLineHeightPx + previewSectionGapPx);
    const titleBaselineY = titleTopY + fontBaselineMm(titleFontPx);

    pdf.setFontSize(pxToPt(attentionFontPx));
    pdf.setTextColor(0, 0, 0);
    pdf.setFont("Times New Roman", "normal");
    const attText = doc.content?.attention_to ? `Att: ${doc.content.attention_to}` : "Att:";
    pdf.text(attText, headerMarginX + pxToMm(previewAttentionIndentPx), attentionBaselineY);
    
    // Draw dotted line after "Att:"
    // const attWidth = pdf.getTextWidth(attText);
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    // Draw dots
    // for (let x = 12 + attWidth + 2; x < pageWidth - 12; x += 3) {
    //   pdf.text(".", x, yPos);
    // }

    // Document Title - centered and bold
    pdf.setFontSize(pxToPt(titleFontPx));
    pdf.setFont("Times New Roman", "bold");
    pdf.text(doc.title.toUpperCase(), pageWidth / 2, titleBaselineY, { align: "center" });
    yPos = titleTopY + pxToMm(titleLineHeightPx + previewSectionGapPx);

    // Table structure matching the approved reference layout
    const marginX = 12;
    const tableWidth = pageWidth - (marginX * 2);
    const qtyWidth = 20;
    const descriptionWidth = 95;
    const unitPriceWidth = 20;
    const kwachaWidth = 42;
    const tambalaWidth = tableWidth - qtyWidth - descriptionWidth - unitPriceWidth - kwachaWidth;

    const qtyX = marginX;
    const descriptionX = qtyX + qtyWidth;
    const unitPriceX = descriptionX + descriptionWidth;
    const kwachaX = unitPriceX + unitPriceWidth;
    const tambalaX = kwachaX + kwachaWidth;

    const headerRowHeight = 10;
    const amountRowHeight = 7;
    const rowHeight = 8;
    const totalMaterialsRowHeight = 10;
    const laborRowHeight = 9;
    const netTotalRowHeight = 9;
    const blueBandWidth = unitPriceX + unitPriceWidth - qtyX;
    const itemFontSizePt = 12;
    const totalMaterialsFontSizePt = 18;
    const laborFontSizePt = 16;
    const netTotalFontSizePt = 18;

    const drawTableHeader = () => {
      pdf.setDrawColor(31, 31, 31);
      pdf.setLineWidth(0.35);
      pdf.setTextColor(0, 0, 0);

      pdf.rect(qtyX, yPos, qtyWidth, headerRowHeight);
      pdf.rect(descriptionX, yPos, descriptionWidth, headerRowHeight);
      pdf.rect(unitPriceX, yPos, unitPriceWidth, headerRowHeight);
      pdf.rect(kwachaX, yPos, kwachaWidth + tambalaWidth, headerRowHeight);

      pdf.setFont("times", "bold");
      pdf.setFontSize(15);
      pdf.text("QTY", qtyX + qtyWidth / 2, yPos + 6.7, { align: "center" });
      pdf.text("DESCRIPTION", descriptionX + descriptionWidth / 2, yPos + 6.7, { align: "center" });
      pdf.setFont("times", "italic");
      pdf.text("@", unitPriceX + unitPriceWidth / 2, yPos + 6.7, { align: "center" });
      pdf.setFont("times", "bold");
      pdf.text("AMOUNT", kwachaX + (kwachaWidth + tambalaWidth) / 2, yPos + 6.7, { align: "center" });

      yPos += headerRowHeight;

      pdf.setFillColor(15, 51, 86);
      pdf.rect(qtyX, yPos, blueBandWidth, amountRowHeight, "FD");
      pdf.rect(kwachaX, yPos, kwachaWidth, amountRowHeight);
      pdf.rect(tambalaX, yPos, tambalaWidth, amountRowHeight);

      pdf.setFont("times", "italic");
      pdf.setFontSize(11);
      pdf.text("K", kwachaX + kwachaWidth / 2, yPos + 4.9, { align: "center" });
      pdf.text("t", tambalaX + tambalaWidth / 2, yPos + 4.9, { align: "center" });

      yPos += amountRowHeight;

      pdf.setFont(centuryGothicPdfFont, "normal");
      pdf.setFontSize(itemFontSizePt);
    };

    drawTableHeader();

    const items = doc.content?.items || [];

    items.forEach((item: any) => {
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = 20;
        drawTableHeader();
      }

      const formattedAmount = formatTableAmount(item.amount || 0);

      pdf.rect(qtyX, yPos, qtyWidth, rowHeight);
      pdf.rect(descriptionX, yPos, descriptionWidth, rowHeight);
      pdf.rect(unitPriceX, yPos, unitPriceWidth, rowHeight);
      pdf.rect(kwachaX, yPos, kwachaWidth, rowHeight);
      pdf.rect(tambalaX, yPos, tambalaWidth, rowHeight);

      const itemTextBaseline = rowTextBaseline(yPos, rowHeight, itemFontSizePt);

      pdf.text(String(item.qty ?? ""), qtyX + qtyWidth / 2, itemTextBaseline, { align: "center" });

      const descLines = pdf.splitTextToSize(String(item.description || ""), descriptionWidth - 4);
      pdf.text(descLines[0] || "", descriptionX + 2, itemTextBaseline);

      pdf.text(formatGroupedNumber(Number(item.unit_price || 0)), unitPriceX + unitPriceWidth - 2.5, itemTextBaseline, {
        align: "right",
      });
      pdf.text(formattedAmount.kwacha, kwachaX + kwachaWidth - 2.5, itemTextBaseline, { align: "right" });
      pdf.text(formattedAmount.tambala, tambalaX + tambalaWidth / 2, itemTextBaseline, { align: "center" });

      yPos += rowHeight;
    });

    const minRows = 10;
    const emptyRowsNeeded = Math.max(0, minRows - items.length);
    for (let i = 0; i < emptyRowsNeeded; i++) {
      if (yPos > pageHeight - 50) {
        break;
      }

      pdf.rect(qtyX, yPos, qtyWidth, rowHeight);
      pdf.rect(descriptionX, yPos, descriptionWidth, rowHeight);
      pdf.rect(unitPriceX, yPos, unitPriceWidth, rowHeight);
      pdf.rect(kwachaX, yPos, kwachaWidth, rowHeight);
      pdf.rect(tambalaX, yPos, tambalaWidth, rowHeight);

      pdf.text("00", tambalaX + tambalaWidth / 2, rowTextBaseline(yPos, rowHeight, itemFontSizePt), { align: "center" });

      yPos += rowHeight;
    }

    if (yPos > pageHeight - 40) {
      pdf.addPage();
      yPos = 20;
      drawTableHeader();
    }

    const subtotal = formatTableAmount(doc.content?.subtotal || 0);
    const laborCost = formatTableAmount(doc.content?.labor_cost || 0);
    const total = formatTableAmount(doc.content?.total || 0);

    if (isInvoice) {
      // Subtotal Row
      pdf.setFillColor(15, 51, 86); // Dark Blue
      pdf.rect(qtyX, yPos, qtyWidth + descriptionWidth + unitPriceWidth, totalMaterialsRowHeight, "F"); 
      
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(qtyX, yPos, qtyWidth, totalMaterialsRowHeight);
      pdf.rect(descriptionX, yPos, descriptionWidth, totalMaterialsRowHeight);
      pdf.rect(unitPriceX, yPos, unitPriceWidth, totalMaterialsRowHeight);
      
      pdf.setFillColor(255, 255, 255);
      pdf.rect(kwachaX, yPos, kwachaWidth, totalMaterialsRowHeight, "FD");
      pdf.rect(tambalaX, yPos, tambalaWidth, totalMaterialsRowHeight, "FD");

      pdf.setFont(centuryGothicPdfFont, "bold");
      pdf.setFontSize(itemFontSizePt);
      pdf.setTextColor(0, 0, 0);
      const subtotalBaseline = rowTextBaseline(yPos, totalMaterialsRowHeight, itemFontSizePt);
      pdf.text(subtotal.kwacha, kwachaX + kwachaWidth - 2.5, subtotalBaseline, { align: "right" });
      pdf.text(subtotal.tambala, tambalaX + tambalaWidth / 2, subtotalBaseline, { align: "center" });

      yPos += totalMaterialsRowHeight;

      // Labour Row
      pdf.setFillColor(15, 51, 86);
      pdf.rect(qtyX, yPos, qtyWidth, laborRowHeight, "F");
      pdf.rect(unitPriceX, yPos, unitPriceWidth, laborRowHeight, "F");

      pdf.setDrawColor(0, 0, 0);
      pdf.rect(qtyX, yPos, qtyWidth, laborRowHeight);
      pdf.rect(unitPriceX, yPos, unitPriceWidth, laborRowHeight);
      
      pdf.setFillColor(255, 255, 255);
      pdf.rect(descriptionX, yPos, descriptionWidth, laborRowHeight, "FD");
      pdf.rect(kwachaX, yPos, kwachaWidth, laborRowHeight, "FD");
      pdf.rect(tambalaX, yPos, tambalaWidth, laborRowHeight, "FD");

      const laborBaseline = rowTextBaseline(yPos, laborRowHeight, itemFontSizePt);
      pdf.setFont(centuryGothicPdfFont, "bold");
      pdf.text("Labour charge", descriptionX + descriptionWidth - 5, laborBaseline, { align: "right" });
      pdf.text(laborCost.kwacha, kwachaX + kwachaWidth - 2.5, laborBaseline, { align: "right" });
      pdf.text(laborCost.tambala, tambalaX + tambalaWidth / 2, laborBaseline, { align: "center" });

      yPos += laborRowHeight;

      // Net Total Row
      pdf.setFillColor(255, 255, 255);
      pdf.rect(qtyX, yPos, blueBandWidth, netTotalRowHeight, "FD");
      pdf.rect(kwachaX, yPos, kwachaWidth, netTotalRowHeight, "FD");
      pdf.rect(tambalaX, yPos, tambalaWidth, netTotalRowHeight, "FD");
      
      const netTotalBaseline = rowTextBaseline(yPos, netTotalRowHeight, netTotalFontSizePt);
      pdf.setFont(calibriPdfFont, "bold");
      pdf.setFontSize(netTotalFontSizePt);
      pdf.text("NET TOTAL", qtyX + blueBandWidth / 2, netTotalBaseline, { align: "center" });
      pdf.text(total.kwacha, kwachaX + kwachaWidth - 2.5, netTotalBaseline, { align: "right" });
      pdf.text(total.tambala, tambalaX + tambalaWidth / 2, netTotalBaseline, { align: "center" });

      yPos += netTotalRowHeight;
    } else {
      pdf.setFont(centuryGothicPdfFont, "bold");
      pdf.setFontSize(totalMaterialsFontSizePt);
      pdf.rect(qtyX, yPos, qtyWidth, totalMaterialsRowHeight);
      pdf.rect(descriptionX, yPos, descriptionWidth, totalMaterialsRowHeight);
      pdf.rect(unitPriceX, yPos, unitPriceWidth, totalMaterialsRowHeight);
      pdf.rect(kwachaX, yPos, kwachaWidth, totalMaterialsRowHeight);
      pdf.rect(tambalaX, yPos, tambalaWidth, totalMaterialsRowHeight);
      const totalMaterialsBaseline = rowTextBaseline(yPos, totalMaterialsRowHeight, totalMaterialsFontSizePt);
      pdf.text("TOTAL COST OF MATERIALS", descriptionX + descriptionWidth / 2, totalMaterialsBaseline, { align: "center" });
      pdf.text(subtotal.kwacha, kwachaX + kwachaWidth - 2.5, totalMaterialsBaseline, { align: "right" });
      pdf.text(subtotal.tambala, tambalaX + tambalaWidth / 2, totalMaterialsBaseline, { align: "center" });

      yPos += totalMaterialsRowHeight;

      pdf.setFont(centuryGothicPdfFont, "bold");
      pdf.setFontSize(laborFontSizePt);
      pdf.rect(qtyX, yPos, blueBandWidth, laborRowHeight);
      pdf.rect(kwachaX, yPos, kwachaWidth, laborRowHeight);
      pdf.rect(tambalaX, yPos, tambalaWidth, laborRowHeight);
      const laborBaseline = rowTextBaseline(yPos, laborRowHeight, laborFontSizePt);
      pdf.text("Labour cost and transport", qtyX + blueBandWidth / 2, laborBaseline, { align: "center" });
      pdf.text(laborCost.kwacha, kwachaX + kwachaWidth - 2.5, laborBaseline, { align: "right" });
      pdf.text(laborCost.tambala, tambalaX + tambalaWidth / 2, laborBaseline, { align: "center" });

      yPos += laborRowHeight;

      pdf.setFont(calibriPdfFont, "bold");
      pdf.setFontSize(netTotalFontSizePt);
      pdf.rect(qtyX, yPos, blueBandWidth, netTotalRowHeight);
      pdf.rect(kwachaX, yPos, kwachaWidth, netTotalRowHeight);
      pdf.rect(tambalaX, yPos, tambalaWidth, netTotalRowHeight);
      const netTotalBaseline = rowTextBaseline(yPos, netTotalRowHeight, netTotalFontSizePt);
      pdf.text("NET TOTAL", qtyX + blueBandWidth / 2, netTotalBaseline, { align: "center" });
      pdf.text(total.kwacha, kwachaX + kwachaWidth - 2.5, netTotalBaseline, { align: "right" });
      pdf.text(total.tambala, tambalaX + tambalaWidth / 2, netTotalBaseline, { align: "center" });

      yPos += netTotalRowHeight;
    }

    // Notes section (if any)
    if (doc.content?.notes) {
      pdf.setFontSize(9);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(0, 0, 0);
      const splitNotes = pdf.splitTextToSize(doc.content.notes, tableWidth);
      const noteLineHeight = 4;
      const footerBarHeight = 4;
      const footerGap = 2;
      const notesHeight = splitNotes.length * noteLineHeight;
      const footerBarY = pageHeight - footerBarHeight;
      const notesY = Math.max(yPos + 10, footerBarY - footerGap - notesHeight);
      pdf.text(splitNotes, qtyX, notesY);
    }
    
    if (isInvoice) {
      if (yPos > pageHeight - 40) {
        pdf.addPage();
        yPos = 20;
      }
      yPos += 20; 
      pdf.setFontSize(11);
      pdf.setFont("Times New Roman", "italic");
      pdf.setTextColor(0, 0, 0);
      pdf.text("Authorised signature: .......................................", pageWidth - marginX - 5, yPos, { align: "right" });
    }

    // Orange footer bar at the page bottom border
    pdf.setFillColor(245, 158, 11);
    pdf.rect(0, pageHeight - 4, pageWidth, 4, "F");

    pdf.save(`${doc.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success("PDF downloaded successfully!");
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Documents</h1>
          <p className="text-muted-foreground">Create and manage company documents</p>
        </div>
        {!isEmployee && (
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingDoc(null);
              resetForm();
            }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Document
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDoc ? "Edit Document" : "Create New Document"}</DialogTitle>
              <DialogDescription>
                {editingDoc ? "Update document details" : "Generate a new company document"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Document Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., QUOTATION FOR WALL TOP ELECTRIC FENCE"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="document_type">Document Type</Label>
                  <Select
                    value={formData.document_type}
                    onValueChange={(value) => setFormData({ ...formData, document_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="quotation">Quotation</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      {/* <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="report">Report</SelectItem> */}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Document Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formData.document_date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.document_date ? format(formData.document_date, "dd/MM/yyyy") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.document_date}
                        onSelect={(date) => date && setFormData({ ...formData, document_date: date })}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project_id">Link to Project (Optional)</Label>
                <Select
                  value={formData.project_id}
                  onValueChange={(value) => setFormData({ ...formData, project_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <DocumentEditor
                items={formData.content.items}
                laborCost={formData.content.labor_cost}
                notes={formData.content.notes}
                attentionTo={formData.content.attention_to}
                onItemsChange={(items) =>
                  setFormData({ ...formData, content: { ...formData.content, items } })
                }
                onLaborCostChange={(cost) =>
                  setFormData({ ...formData, content: { ...formData.content, labor_cost: cost } })
                }
                onNotesChange={(notes) =>
                  setFormData({ ...formData, content: { ...formData.content, notes } })
                }
                onAttentionToChange={(value) =>
                  setFormData({ ...formData, content: { ...formData.content, attention_to: value } })
                }
              />

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingDoc ? "Update Document" : "Create Document"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No documents yet</p>
              {!isEmployee && (
                <Button onClick={() => setOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Document
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <CardTitle className="text-lg">{doc.title}</CardTitle>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                    {doc.document_type}
                  </span>
                </div>
                {doc.projects && (
                  <CardDescription>Project: {doc.projects.name}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  Created: {format(new Date(doc.created_at), 'MMM dd, yyyy')}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewDoc(doc)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => generatePDF(doc)}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download
                  </Button>
                  {!isEmployee && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(doc)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteDoc(doc)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <DocumentPreview
        doc={previewDoc}
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      />

      <AlertDialog open={!!deleteDoc} onOpenChange={() => setDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDoc?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
