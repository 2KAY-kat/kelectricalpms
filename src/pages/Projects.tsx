import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, MapPin, Calendar, DollarSign, X, Edit } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { projectSchema } from "@/lib/validations";
import { z } from "zod";
import { useUserRole } from "@/hooks/useUserRole";
import { useSearchParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

export default function Projects() {
  const { isManager, isEmployee } = useUserRole();
  const [searchParams] = useSearchParams();
  const highlightProjectId = searchParams.get("project");
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [phaseDialogOpen, setPhaseDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [newPhase, setNewPhase] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planning",
    progress: 0,
    start_date: "",
    end_date: "",
    budget: "",
    client_name: "",
    client_contact: "",
    location_address: "",
    current_phase: "planning",
    phases: [] as string[],
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (highlightProjectId && projects.length > 0) {
      const element = document.getElementById(`project-${highlightProjectId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("ring-2", "ring-primary", "ring-offset-2");
        setTimeout(() => {
          element.classList.remove("ring-2", "ring-primary", "ring-offset-2");
        }, 3000);
      }
    }
  }, [highlightProjectId, projects]);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load projects");
    } else {
      setProjects(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Prepare data for validation
      const dataToValidate = {
        name: formData.name,
        description: formData.description || undefined,
        status: formData.status,
        progress: parseInt(formData.progress.toString()) || 0,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        budget: formData.budget ? parseFloat(formData.budget) : undefined,
        client_name: formData.client_name || undefined,
        client_contact: formData.client_contact || undefined,
        location_address: formData.location_address || undefined,
        current_phase: formData.current_phase,
        phases: formData.phases,
      };

      // Validate input
      const validatedData = projectSchema.parse(dataToValidate);

      const { data: { user } } = await supabase.auth.getUser();

      const projectData: any = {
        ...validatedData,
        created_by: user?.id,
      };

      const { error } = await supabase.from("projects").insert(projectData);

      if (error) {
        toast.error("Failed to create project");
      } else {
        toast.success("Project created successfully!");
        setOpen(false);
        resetForm();
        fetchProjects();
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

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      status: "planning",
      progress: 0,
      start_date: "",
      end_date: "",
      budget: "",
      client_name: "",
      client_contact: "",
      location_address: "",
      current_phase: "planning",
      phases: [],
    });
  };

  const handlePhaseUpdate = async (projectId: string, newPhase: string, newProgress?: number) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updateData: any = {
      current_phase: newPhase,
      phase_history: [...(project.phase_history || []), {
        phase: newPhase,
        timestamp: new Date().toISOString(),
        progress: newProgress !== undefined ? newProgress : project.progress
      }]
    };

    if (newProgress !== undefined) {
      updateData.progress = newProgress;
    }

    const { error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId);

    if (error) {
      toast.error("Failed to update project phase");
      return;
    }

    // Create bulletin post about the update
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("bulletin_posts").insert({
      title: `Project Update: ${project.name}`,
      content: `${project.name} has been updated to phase: ${newPhase}${newProgress !== undefined ? ` (${newProgress}% complete)` : ''}`,
      priority: "normal",
      created_by: user?.id,
      project_id: projectId,
    });

    toast.success("Project phase updated and posted to bulletin!");
    fetchProjects();
  };

  const handleAddPhase = () => {
    if (!newPhase.trim() || !selectedProject) return;
    
    const updatedPhases = [...(selectedProject.phases || []), newPhase.trim()];
    
    supabase
      .from("projects")
      .update({ phases: updatedPhases })
      .eq("id", selectedProject.id)
      .then(({ error }) => {
        if (error) {
          toast.error("Failed to add phase");
        } else {
          toast.success("Phase added successfully");
          setNewPhase("");
          fetchProjects();
        }
      });
  };

  const handleRemovePhase = (projectId: string, phaseToRemove: string) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedPhases = (project.phases || []).filter((p: string) => p !== phaseToRemove);
    
    supabase
      .from("projects")
      .update({ phases: updatedPhases })
      .eq("id", projectId)
      .then(({ error }) => {
        if (error) {
          toast.error("Failed to remove phase");
        } else {
          toast.success("Phase removed");
          fetchProjects();
        }
      });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'in_progress': return 'bg-warning text-warning-foreground';
      case 'on_hold': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-primary text-primary-foreground';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">Loading projects...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">Manage your engineering projects</p>
        </div>
        {!isEmployee && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Project
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
              <DialogDescription>Add a new project to your management system</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name</Label>
                  <Input
                    id="client_name"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="client_contact">Client Contact</Label>
                  <Input
                    id="client_contact"
                    value={formData.client_contact}
                    onChange={(e) => setFormData({ ...formData, client_contact: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget</Label>
                  <Input
                    id="budget"
                    type="number"
                    step="0.01"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location_address">Location</Label>
                <Input
                  id="location_address"
                  value={formData.location_address}
                  onChange={(e) => setFormData({ ...formData, location_address: e.target.value })}
                  placeholder="Project site address"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Project</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No projects yet</p>
              {!isEmployee && (
                <Button onClick={() => setOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Project
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} id={`project-${project.id}`} className="shadow-card hover:shadow-elevated transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{project.name}</CardTitle>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(project.status)}`}>
                    {project.status.replace('_', ' ')}
                  </span>
                </div>
                {project.description && (
                  <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Phase Badge */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Current Phase:</span>
                  <Badge variant="outline">{project.current_phase || 'planning'}</Badge>
                </div>

                {/* Phase Management for Managers */}
                {isManager && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Update Phase</Label>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedProject(project);
                          setPhaseDialogOpen(true);
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Manage Phases
                      </Button>
                    </div>
                    <Select
                      value={project.current_phase || "planning"}
                      onValueChange={(value) => handlePhaseUpdate(project.id, value)}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planning">Planning</SelectItem>
                        <SelectItem value="tubing">Tubing</SelectItem>
                        <SelectItem value="wiring">Wiring</SelectItem>
                        {(project.phases || []).map((phase: string) => (
                          <SelectItem key={phase} value={phase}>
                            {phase}
                          </SelectItem>
                        ))}
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {isManager && project.client_name && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Client:</span>
                    <span className="ml-2 font-medium">{project.client_name}</span>
                  </div>
                )}

                {isManager && project.budget && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">${parseFloat(project.budget).toLocaleString()}</span>
                  </div>
                )}

                {project.start_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(project.start_date), 'MMM dd, yyyy')}</span>
                  </div>
                )}

                {project.location_address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span className="line-clamp-1">{project.location_address}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Phase Management Dialog */}
      <Dialog open={phaseDialogOpen} onOpenChange={setPhaseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Custom Phases</DialogTitle>
            <DialogDescription>
              Add custom phases for {selectedProject?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="New phase name (e.g., Foundation, Inspection)"
                value={newPhase}
                onChange={(e) => setNewPhase(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddPhase()}
              />
              <Button onClick={handleAddPhase}>Add</Button>
            </div>
            <div className="space-y-2">
              <Label>Current Custom Phases:</Label>
              <div className="flex flex-wrap gap-2">
                {(selectedProject?.phases || []).map((phase: string) => (
                  <Badge key={phase} variant="secondary" className="gap-1">
                    {phase}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemovePhase(selectedProject.id, phase)}
                    />
                  </Badge>
                ))}
                {(!selectedProject?.phases || selectedProject.phases.length === 0) && (
                  <p className="text-sm text-muted-foreground">No custom phases yet</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}