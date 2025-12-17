import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, FileText, Download, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { format } from "date-fns";
import { documentSchema } from "@/lib/validations";
import { z } from "zod";
import { DocumentEditor } from "@/components/DocumentEditor";
import { useUserRole } from "@/hooks/useUserRole";

export default function Documents() {
  const { isEmployee } = useUserRole();
  const [documents, setDocuments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [branding, setBranding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<any>(null);
  const [deleteDoc, setDeleteDoc] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    document_type: "quotation",
    project_id: "",
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

    // Load logo
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };

    try {
      const logo = await loadImage("/images/combined-logo.png");
      pdf.addImage(logo, "PNG", 12, yPos, 30, 25);
    } catch (e) {
      console.log("Could not load logo");
    }

    // Company name - ELECTRICAL & POWER ENGINEERING
    pdf.setFontSize(16);
    pdf.setTextColor(30, 58, 138); // Dark blue
    pdf.setFont(undefined, "bold");
    pdf.text("ELECTRICAL & POWER ENGINEERING", 45, yPos + 8);

    // Tagline - "beyond electricals" with letter spacing
    pdf.setFontSize(10);
    pdf.setTextColor(245, 158, 11); // Orange
    pdf.setFont(undefined, "italic");
    pdf.text("b e y o n d   e l e c t r i c a l s", 45, yPos + 14);

    // Date on the right
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, "normal");
    const dateStr = format(new Date(doc.created_at), "dd/MM/yyyy");
    pdf.text(`Date: ${dateStr}`, pageWidth - 15, yPos + 8, { align: "right" });

    yPos += 20;

    // Contact info row
    pdf.setFontSize(8);
    pdf.setTextColor(60, 60, 60);
    pdf.setFont(undefined, "normal");

    // Website with globe icon (circle)
    pdf.setDrawColor(30, 58, 138);
    pdf.circle(47, yPos + 1.5, 2, "S");
    pdf.text("https://kelectrical.vercel.app", 51, yPos + 2.5);

    // Email with envelope icon (rectangle)
    pdf.rect(46, yPos + 6, 3, 2);
    pdf.text("k.electricalandpowerengineering@gmail.com", 51, yPos + 7.5);

    // Phone icon and numbers (center)
    const phoneX = 115;
    pdf.setLineWidth(0.5);
    // Phone icon placeholder
    pdf.line(phoneX, yPos, phoneX + 2, yPos + 4);
    pdf.text("099 912 1675", phoneX + 5, yPos + 2.5);
    pdf.text("089 764 4624", phoneX + 5, yPos + 7);

    // Phone with receiver icon and international numbers (right)
    const intPhoneX = 155;
    pdf.circle(intPhoneX, yPos + 1.5, 2, "S");
    pdf.text("265 (0) 99 9121 675", intPhoneX + 4, yPos + 2.5);
    pdf.text("265 (0) 89 7644 624", intPhoneX + 4, yPos + 7);

    yPos += 14;

    // Thin separator line
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(12, yPos, pageWidth - 12, yPos);
    yPos += 8;

    // Attention To with dotted line
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, "normal");
    const attText = doc.content?.attention_to ? `Att: ${doc.content.attention_to}` : "Att:";
    pdf.text(attText, 12, yPos);
    
    // Draw dotted line after "Att:"
    const attWidth = pdf.getTextWidth(attText);
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    // Draw dots
    for (let x = 12 + attWidth + 2; x < pageWidth - 12; x += 3) {
      pdf.text(".", x, yPos);
    }
    yPos += 10;

    // Document Title - centered and bold
    pdf.setFontSize(12);
    pdf.setFont(undefined, "bold");
    pdf.text(doc.title.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
    yPos += 8;

    // Table structure matching template exactly
    const marginX = 12;
    const tableWidth = pageWidth - (marginX * 2);
    const col1Width = 25;  // QTY
    const col2Width = 95;  // DESCRIPTION
    const col3Width = 25;  // @
    const col4Width = 20;  // K (unit price column)
    const col5Width = 16;  // K (kwacha)
    const col6Width = tableWidth - col1Width - col2Width - col3Width - col4Width - col5Width; // t (tambala)
    
    const col1X = marginX;
    const col2X = col1X + col1Width;
    const col3X = col2X + col2Width;
    const col4X = col3X + col3Width;
    const col5X = col4X + col4Width;
    const col6X = col5X + col5Width;
    const tableEndX = marginX + tableWidth;
    
    const rowHeight = 8;

    // Table Header Row 1 - White background with black text
    const headerRow1Y = yPos;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.5);
    
    // Draw header row 1 cells
    pdf.rect(col1X, yPos, col1Width, rowHeight);
    pdf.rect(col2X, yPos, col2Width, rowHeight);
    pdf.rect(col3X, yPos, col3Width, rowHeight);
    pdf.rect(col4X, yPos, tableEndX - col4X, rowHeight); // AMOUNT spans to end
    
    pdf.setFontSize(11);
    pdf.setFont(undefined, "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text("QTY", col1X + col1Width/2, yPos + 6, { align: "center" });
    pdf.text("DESCRIPTION", col2X + col2Width/2, yPos + 6, { align: "center" });
    pdf.text("@", col3X + col3Width/2, yPos + 6, { align: "center" });
    pdf.text("AMOUNT", col4X + (tableEndX - col4X)/2, yPos + 6, { align: "center" });
    
    yPos += rowHeight;

    // Table Header Row 2 - Dark blue background
    pdf.setFillColor(30, 58, 138);
    pdf.rect(col1X, yPos, tableWidth, rowHeight, 'F');
    
    // Draw vertical lines on blue row
    pdf.setDrawColor(255, 255, 255);
    pdf.line(col2X, yPos, col2X, yPos + rowHeight);
    pdf.line(col3X, yPos, col3X, yPos + rowHeight);
    pdf.line(col4X, yPos, col4X, yPos + rowHeight);
    pdf.line(col5X, yPos, col5X, yPos + rowHeight);
    pdf.line(col6X, yPos, col6X, yPos + rowHeight);
    
    // Blue row text
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.text("K", col4X + col4Width/2, yPos + 6, { align: "center" });
    pdf.text("K", col5X + col5Width/2, yPos + 6, { align: "center" });
    pdf.text("t", col6X + (tableEndX - col6X)/2, yPos + 6, { align: "center" });
    
    yPos += rowHeight;
    
    // Reset for data rows
    pdf.setDrawColor(0, 0, 0);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont(undefined, "normal");
    pdf.setFontSize(9);

    // Table Items
    const items = doc.content?.items || [];
    
    items.forEach((item: any) => {
      if (yPos > pageHeight - 50) {
        pdf.addPage();
        yPos = 20;
      }

      const rowStartY = yPos;
      
      // Format amount
      const amountStr = item.amount.toFixed(2);
      const [kwacha, tambala] = amountStr.split('.');

      // Draw row cells
      pdf.rect(col1X, yPos, col1Width, rowHeight);
      pdf.rect(col2X, yPos, col2Width, rowHeight);
      pdf.rect(col3X, yPos, col3Width, rowHeight);
      pdf.rect(col4X, yPos, col4Width, rowHeight);
      pdf.rect(col5X, yPos, col5Width, rowHeight);
      pdf.rect(col6X, yPos, tableEndX - col6X, rowHeight);

      // Cell content
      pdf.text(item.qty.toString(), col1X + col1Width/2, yPos + 5.5, { align: "center" });
      
      const descLines = pdf.splitTextToSize(item.description, col2Width - 4);
      pdf.text(descLines[0] || "", col2X + 2, yPos + 5.5);
      
      pdf.text(item.unit_price.toLocaleString(), col4X + col4Width - 2, yPos + 5.5, { align: "right" });
      pdf.text(kwacha, col5X + col5Width - 2, yPos + 5.5, { align: "right" });
      pdf.text(tambala, col6X + (tableEndX - col6X)/2, yPos + 5.5, { align: "center" });

      yPos += rowHeight;
    });

    // Add empty rows to fill space (minimum 10 rows)
    const minRows = 10;
    const emptyRowsNeeded = Math.max(0, minRows - items.length);
    for (let i = 0; i < emptyRowsNeeded; i++) {
      if (yPos > pageHeight - 50) break;
      
      pdf.rect(col1X, yPos, col1Width, rowHeight);
      pdf.rect(col2X, yPos, col2Width, rowHeight);
      pdf.rect(col3X, yPos, col3Width, rowHeight);
      pdf.rect(col4X, yPos, col4Width, rowHeight);
      pdf.rect(col5X, yPos, col5Width, rowHeight);
      pdf.rect(col6X, yPos, tableEndX - col6X, rowHeight);
      
      pdf.text("00", col6X + (tableEndX - col6X)/2, yPos + 5.5, { align: "center" });
      
      yPos += rowHeight;
    }

    // Totals section
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(10);
    
    // TOTAL COST OF MATERIALS
    pdf.rect(col1X, yPos, col5X - col1X, rowHeight);
    pdf.rect(col5X, yPos, tableEndX - col5X, rowHeight);
    pdf.text("TOTAL COST OF MATERIALS", col1X + 4, yPos + 5.5);
    
    const subtotal = doc.content?.subtotal || 0;
    pdf.text(subtotal.toLocaleString(), col5X + (col5Width + (tableEndX - col6X))/2, yPos + 5.5, { align: "center" });
    
    yPos += rowHeight;

    // Labour cost and transport
    pdf.setFont(undefined, "italic");
    pdf.rect(col1X, yPos, col5X - col1X, rowHeight);
    pdf.rect(col5X, yPos, tableEndX - col5X, rowHeight);
    pdf.text("Labour cost and transport", col1X + 4, yPos + 5.5);
    
    const laborCost = doc.content?.labor_cost || 0;
    pdf.text(laborCost.toLocaleString(), col5X + (col5Width + (tableEndX - col6X))/2, yPos + 5.5, { align: "center" });
    
    yPos += rowHeight;

    // NET TOTAL
    pdf.setFont(undefined, "bold");
    pdf.setFontSize(11);
    pdf.rect(col1X, yPos, col5X - col1X, rowHeight);
    pdf.rect(col5X, yPos, tableEndX - col5X, rowHeight);
    pdf.text("NET TOTAL", col1X + 4, yPos + 5.5);
    
    const total = doc.content?.total || 0;
    pdf.text(total.toLocaleString(), col5X + (col5Width + (tableEndX - col6X))/2, yPos + 5.5, { align: "center" });
    
    yPos += rowHeight;

    // Orange footer bar
    pdf.setFillColor(245, 158, 11);
    pdf.rect(col1X, yPos, tableWidth, 4, 'F');

    // Notes section (if any)
    if (doc.content?.notes) {
      yPos += 10;
      pdf.setFontSize(9);
      pdf.setFont(undefined, "normal");
      pdf.setTextColor(0, 0, 0);
      const splitNotes = pdf.splitTextToSize(doc.content.notes, tableWidth);
      pdf.text(splitNotes, col1X, yPos);
    }

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
              <div className="grid grid-cols-2 gap-4">
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
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="proposal">Proposal</SelectItem>
                      <SelectItem value="report">Report</SelectItem>
                    </SelectContent>
                  </Select>
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
