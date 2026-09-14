import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, ShieldAlert } from "lucide-react";
import { brandingSchema } from "@/lib/validations";
import { z } from "zod";
import { useUserRole } from "@/hooks/useUserRole";

export default function Branding() {
  const { isManager, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [brandingId, setBrandingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    company_name: "",
    tagline: "",
    primary_color: "#1e40af",
    secondary_color: "#f59e0b",
    address: "",
    phone: "",
    phone_secondary: "",
    email: "",
    website: "",
    bank_name: "",
    bank_account: "",
  });

  useEffect(() => {
    fetchBranding();
  }, []);

  const fetchBranding = async () => {
    const { data, error } = await supabase
      .from("company_branding")
      .select("*")
      .limit(1)
      .single();

    if (!error && data) {
      setBrandingId(data.id);
      setFormData({
        company_name: data.company_name || "",
        tagline: data.tagline || "",
        primary_color: data.primary_color || "#1e40af",
        secondary_color: data.secondary_color || "#f59e0b",
        address: data.address || "",
        phone: data.phone || "",
        phone_secondary: data.phone_secondary || "",
        email: data.email || "",
        website: data.website || "",
        bank_name: data.bank_name || "",
        bank_account: data.bank_account || "",
      });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate input
      const validatedData = brandingSchema.parse(formData);
      const operation = brandingId
        ? supabase
            .from("company_branding")
            .update(validatedData)
            .eq("id", brandingId)
            .select("id")
            .single()
        : supabase
            .from("company_branding")
            .insert(validatedData)
            .select("id")
            .single();

      const { data, error } = await operation;

      setSaving(false);

      if (error) {
        toast.error("Failed to update branding");
      } else {
        if (data?.id) {
          setBrandingId(data.id);
        }
        toast.success("Company branding updated successfully!");
      }
    } catch (error) {
      setSaving(false);
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        toast.error("Invalid input data");
      }
    }
  };

  if (roleLoading || loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading branding settings...</div>;
  }

  if (!isManager) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <ShieldAlert className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Access Restricted</h2>
          <p className="text-muted-foreground">Only administrators and managers can access branding settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Company Branding</h1>
        <p className="text-muted-foreground">Manage your company's branding and information for documents</p>
      </div>

      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <CardTitle>Company Information</CardTitle>
          </div>
          <CardDescription>
            This information will be used in all generated documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name *</Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline / Slogan</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                placeholder="Your company's tagline"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    placeholder="#1e40af"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    placeholder="#f59e0b"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Engineering Drive, Tech City"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Primary Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+265 99 9121675"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone_secondary">Secondary Phone</Label>
                <Input
                  id="phone_secondary"
                  type="tel"
                  value={formData.phone_secondary}
                  onChange={(e) => setFormData({ ...formData, phone_secondary: e.target.value })}
                  placeholder="+265 89 7644624"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="info@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://company.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bank_name">Bank Name</Label>
                <Input
                  id="bank_name"
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  placeholder="National Bank"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_account">Bank Account Number</Label>
                <Input
                  id="bank_account"
                  value={formData.bank_account}
                  onChange={(e) => setFormData({ ...formData, bank_account: e.target.value })}
                  placeholder="1234567890"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-card bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-lg" style={{ color: formData.primary_color }}>
              {formData.company_name || "Company Name"}
            </div>
            {formData.tagline && (
              <div className="text-xs text-muted-foreground italic">{formData.tagline}</div>
            )}
            <div className="text-muted-foreground">{formData.address || "Address"}</div>
            <div className="text-muted-foreground">
              {formData.phone || "Phone"} {formData.phone_secondary && `• ${formData.phone_secondary}`}
            </div>
            <div className="text-muted-foreground">{formData.email || "Email"}</div>
            {formData.website && (
              <div className="text-muted-foreground">{formData.website}</div>
            )}
            {formData.bank_name && (
              <div className="text-muted-foreground text-xs pt-2">
                Bank: {formData.bank_name} {formData.bank_account && `- ${formData.bank_account}`}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
