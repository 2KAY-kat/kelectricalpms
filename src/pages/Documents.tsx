import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, FileText, Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { format } from "date-fns";

export default function Documents() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [branding, setBranding] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    document_type: "quotation",
    project_id: "",
    content: {
      items: [] as any[],
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

    const { data: { user } } = await supabase.auth.getUser();

    const docData: any = {
      title: formData.title,
      document_type: formData.document_type,
      content: formData.content,
      created_by: user?.id,
    };

    if (formData.project_id) docData.project_id = formData.project_id;

    const { error } = await supabase.from("documents").insert(docData);

    if (error) {
      toast.error("Failed to create document");
    } else {
      toast.success("Document created successfully!");
      setOpen(false);
      resetForm();
      fetchData();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      document_type: "quotation",
      project_id: "",
      content: {
        items: [],
        notes: "",
        subtotal: 0,
        tax: 0,
        total: 0,
      },
    });
  };

  const generatePDF = (doc: any) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;

    // Company Header
    if (branding) {
      pdf.setFontSize(20);
      pdf.setTextColor(30, 64, 175); // Primary color
      pdf.text(branding.company_name, pageWidth / 2, 20, { align: "center" });

      pdf.setFontSize(10);
      pdf.setTextColor(100, 100, 100);
      if (branding.address) pdf.text(branding.address, pageWidth / 2, 28, { align: "center" });
      if (branding.phone) pdf.text(`Phone: ${branding.phone}`, pageWidth / 2, 33, { align: "center" });
      if (branding.email) pdf.text(`Email: ${branding.email}`, pageWidth / 2, 38, { align: "center" });
    }

    // Document Title
    pdf.setFontSize(16);
    pdf.setTextColor(0, 0, 0);
    pdf.text(doc.title, 20, 55);

    // Document Type
    pdf.setFontSize(12);
    pdf.text(`Type: ${doc.document_type.toUpperCase()}`, 20, 62);
    pdf.text(`Date: ${format(new Date(doc.created_at), 'MMM dd, yyyy')}`, 20, 68);

    if (doc.projects?.name) {
      pdf.text(`Project: ${doc.projects.name}`, 20, 74);
    }

    // Content
    let yPos = 85;
    pdf.setFontSize(10);

    if (doc.content.items && doc.content.items.length > 0) {
      pdf.text("Items:", 20, yPos);
      yPos += 7;

      doc.content.items.forEach((item: any, index: number) => {
        pdf.text(`${index + 1}. ${item.description || 'Item'} - $${item.amount || 0}`, 25, yPos);
        yPos += 5;
      });

      yPos += 5;
      pdf.text(`Subtotal: $${doc.content.subtotal || 0}`, 20, yPos);
      yPos += 5;
      pdf.text(`Tax: $${doc.content.tax || 0}`, 20, yPos);
      yPos += 5;
      pdf.setFontSize(12);
      pdf.text(`Total: $${doc.content.total || 0}`, 20, yPos);
    }

    if (doc.content.notes) {
      yPos += 10;
      pdf.setFontSize(10);
      pdf.text("Notes:", 20, yPos);
      yPos += 5;
      const splitNotes = pdf.splitTextToSize(doc.content.notes, pageWidth - 40);
      pdf.text(splitNotes, 20, yPos);
    }

    pdf.save(`${doc.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    toast.success("PDF downloaded successfully!");
  };

  const getDocTypeIcon = (type: string) => {
    return <FileText className="h-4 w-4 text-primary" />;
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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Document
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Document</DialogTitle>
              <DialogDescription>Generate a new company document</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Document Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g., Q-2024-001"
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
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="invoice">Invoice</SelectItem>
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

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.content.notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content: { ...formData.content, notes: e.target.value },
                    })
                  }
                  rows={4}
                  placeholder="Additional notes or terms..."
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Document</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {documents.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No documents yet</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create First Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="shadow-card hover:shadow-elevated transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getDocTypeIcon(doc.document_type)}
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

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => generatePDF(doc)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}