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
    let yPos = 12;

    // Load logos
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
      // Load both logo parts
      const [kLogo, sunLogo] = await Promise.all([
        loadImage("/images/kelectrical-logo.png"),
        loadImage("/images/logopart.png"),
      ]);

      // Draw K logo (left side)
      pdf.addImage(kLogo, "PNG", 15, yPos - 2, 18, 18);
      
      // Draw sun/solar logo (next to K)
      pdf.addImage(sunLogo, "PNG", 30, yPos - 2, 12, 18);

    } catch (e) {
      console.log("Could not load logos");
    }

    // Header with company branding
    if (branding) {
      // Company name in dark blue, bold, uppercase - positioned after logos
      pdf.setFontSize(14);
      pdf.setTextColor(30, 58, 138); // Dark blue
      pdf.setFont(undefined, "bold");
      const companyName = branding.company_name?.toUpperCase() || "ELECTRICAL & POWER ENGINEERING";
      pdf.text(companyName, 45, yPos + 5);

      // Tagline in orange - "beyond electricals"
      pdf.setFontSize(9);
      pdf.setTextColor(245, 158, 11); // Orange
      pdf.setFont(undefined, "italic");
      const tagline = branding.tagline || "beyond electricals";
      pdf.text(tagline, 45, yPos + 11);

      // Date on the right - formatted like screenshot
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, "normal");
      const dateStr = format(new Date(doc.created_at), "dd/MM/yyyy");
      pdf.text(`Date: ${dateStr}`, pageWidth - 20, yPos + 5, { align: "right" });

      yPos += 18;

      // Draw horizontal line under header
      pdf.setDrawColor(30, 58, 138);
      pdf.setLineWidth(0.5);
      pdf.line(15, yPos, pageWidth - 15, yPos);
      yPos += 3;

      // Contact info row with icons
      pdf.setFontSize(8);
      pdf.setTextColor(60, 60, 60);
      pdf.setFont(undefined, "normal");

      // Website (left)
      if (branding.website) {
        pdf.setDrawColor(30, 58, 138);
        pdf.circle(18, yPos + 2.5, 2, "S"); // Globe icon placeholder
        pdf.text(branding.website, 22, yPos + 3.5);
      }

      // Phone numbers (center)
      const phoneX = 80;
      if (branding.phone) {
        pdf.circle(phoneX, yPos + 2.5, 2, "S"); // Phone icon placeholder
        pdf.text(branding.phone, phoneX + 4, yPos + 3.5);
      }
      if (branding.phone_secondary) {
        pdf.text(branding.phone_secondary, phoneX + 4, yPos + 7);
      }

      // Email (right side)
      if (branding.email) {
        const emailX = 140;
        pdf.rect(emailX - 2, yPos + 1, 3, 2); // Email icon placeholder
        pdf.text(branding.email, emailX + 3, yPos + 3.5);
      }

      yPos += 12;

      // Draw another horizontal line
      pdf.setDrawColor(30, 58, 138);
      pdf.setLineWidth(0.3);
      pdf.line(15, yPos, pageWidth - 15, yPos);
      yPos += 5;
    }

    // Attention To with line
    if (doc.content?.attention_to) {
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont(undefined, "normal");
      pdf.text(`Att: ${doc.content.attention_to}`, 20, yPos);
      const textWidth = pdf.getTextWidth(`Att: ${doc.content.attention_to}`);
      pdf.setDrawColor(0, 0, 0);
      pdf.line(20 + textWidth + 2, yPos + 1, pageWidth - 20, yPos + 1);
      yPos += 10;
    }

    // Document Title - centered
    pdf.setFontSize(12);
    pdf.setFont(undefined, "bold");
    pdf.text(doc.title.toUpperCase(), pageWidth / 2, yPos, { align: "center" });
    yPos += 8;

    // Table with borders
    const tableStartY = yPos;
    const col1X = 20;
    const col2X = 45;
    const col3X = 140;
    const col4X = 160;
    const col5X = pageWidth - 30;
    const col6X = pageWidth - 20;
    const rowHeight = 7;

    // Table Header - dark blue background
    pdf.setFillColor(30, 58, 138); // Dark blue
    pdf.rect(col1X, yPos, col6X - col1X, rowHeight, 'F');
    
    pdf.setTextColor(255, 255, 255); // White text
    pdf.setFontSize(10);
    pdf.setFont(undefined, "bold");
    pdf.text("QTY", col1X + 2, yPos + 5);
    pdf.text("DESCRIPTION", col2X + 2, yPos + 5);
    pdf.text("@", col3X + 2, yPos + 5);
    pdf.text("AMOUNT", col4X + 2, yPos + 5);
    pdf.text("K", col5X + 2, yPos + 5);
    pdf.text("t", col6X - 8, yPos + 5);
    
    yPos += rowHeight;

    // Draw vertical lines for header
    pdf.setDrawColor(30, 58, 138);
    pdf.line(col1X, tableStartY, col1X, yPos);
    pdf.line(col2X, tableStartY, col2X, yPos);
    pdf.line(col3X, tableStartY, col3X, yPos);
    pdf.line(col4X, tableStartY, col4X, yPos);
    pdf.line(col5X, tableStartY, col5X, yPos);
    pdf.line(col6X, tableStartY, col6X, yPos);

    // Table Items
    pdf.setFont(undefined, "normal");
    pdf.setTextColor(0, 0, 0);
    pdf.setDrawColor(0, 0, 0);
    const items = doc.content?.items || [];
    
    items.forEach((item: any, index: number) => {
      const rowStartY = yPos;
      
      if (yPos > 250) {
        pdf.addPage();
        yPos = 20;
      }

      // Format amount with decimals
      const amountStr = item.amount.toFixed(2);
      const [kwacha, tambala] = amountStr.split('.');

      pdf.text(item.qty.toString(), col1X + 2, yPos + 5);
      
      const description = pdf.splitTextToSize(item.description, col3X - col2X - 4);
      pdf.text(description, col2X + 2, yPos + 5);
      
      pdf.text(item.unit_price.toFixed(2), col3X + 2, yPos + 5);
      pdf.text(kwacha, col4X + 2, yPos + 5, { align: "right", baseline: "top" });
      pdf.text(tambala, col5X + 2, yPos + 5);

      const itemHeight = Math.max(rowHeight, description.length * 5);
      yPos += itemHeight;

      // Draw cell borders
      pdf.rect(col1X, rowStartY, col2X - col1X, itemHeight);
      pdf.rect(col2X, rowStartY, col3X - col2X, itemHeight);
      pdf.rect(col3X, rowStartY, col4X - col3X, itemHeight);
      pdf.rect(col4X, rowStartY, col5X - col4X, itemHeight);
      pdf.rect(col5X, rowStartY, col6X - col5X, itemHeight);
    });

    // Totals section with borders
    const totalsStartY = yPos;
    
    // Total Cost of Materials
    pdf.setFont(undefined, "bold");
    pdf.rect(col1X, yPos, col4X - col1X, rowHeight);
    pdf.rect(col4X, yPos, col6X - col4X, rowHeight);
    pdf.text("TOTAL COST OF MATERIALS", col1X + 2, yPos + 5);
    
    const subtotal = doc.content?.subtotal || 0;
    const subtotalStr = subtotal.toFixed(2);
    const [subK, subT] = subtotalStr.split('.');
    pdf.text(subK, col4X + 2, yPos + 5, { align: "right" });
    pdf.text(subT, col5X + 2, yPos + 5);
    
    yPos += rowHeight;

    // Labour cost
    pdf.rect(col1X, yPos, col4X - col1X, rowHeight);
    pdf.rect(col4X, yPos, col6X - col4X, rowHeight);
    pdf.text("Labour cost", col1X + 2, yPos + 5);
    
    const laborCost = doc.content?.labor_cost || 0;
    const laborStr = laborCost.toFixed(2);
    const [laborK, laborT] = laborStr.split('.');
    pdf.text(laborK, col4X + 2, yPos + 5, { align: "right" });
    pdf.text(laborT, col5X + 2, yPos + 5);
    
    yPos += rowHeight;

    // NET TOTAL
    pdf.rect(col1X, yPos, col4X - col1X, rowHeight);
    pdf.rect(col4X, yPos, col6X - col4X, rowHeight);
    pdf.setFontSize(12);
    pdf.text("NET TOTAL", col1X + 2, yPos + 5);
    
    const total = doc.content?.total || 0;
    const totalStr = total.toFixed(2);
    const [totalK, totalT] = totalStr.split('.');
    pdf.text(totalK, col4X + 2, yPos + 5, { align: "right" });
    pdf.text(totalT, col5X + 2, yPos + 5);
    
    yPos += rowHeight;

    // Orange footer bar
    pdf.setFillColor(245, 158, 11); // Orange
    pdf.rect(col1X, yPos, col6X - col1X, 5, 'F');

    // Notes
    if (doc.content?.notes) {
      yPos += 10;
      pdf.setFontSize(9);
      pdf.setFont(undefined, "normal");
      const splitNotes = pdf.splitTextToSize(doc.content.notes, pageWidth - 40);
      pdf.text(splitNotes, 20, yPos);
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
