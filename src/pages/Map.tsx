import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// Note: Users will need to provide their own Mapbox token
const MAPBOX_TOKEN = ""; // Placeholder - user needs to add their token

export default function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [apiKey, setApiKey] = useState("");
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .not("location_address", "is", null);

    if (!error && data) {
      setProjects(data);
    }
  };

  const initializeMap = () => {
    if (!mapContainer.current || !apiKey) return;

    mapboxgl.accessToken = apiKey;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add markers for projects with location
    projects.forEach((project) => {
      if (project.location_lat && project.location_lng) {
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div class="p-2">
            <h3 class="font-semibold">${project.name}</h3>
            <p class="text-sm text-gray-600">${project.location_address || 'Project Site'}</p>
            <p class="text-xs text-gray-500 mt-1">Status: ${project.status}</p>
          </div>`
        );

        const marker = new mapboxgl.Marker({
          color: project.status === 'completed' ? '#34d399' : project.status === 'in_progress' ? '#fbbf24' : '#60a5fa',
        })
          .setLngLat([project.location_lng, project.location_lat])
          .setPopup(popup)
          .addTo(map.current!);
      }
    });

    setMapReady(true);
    toast.success("Map initialized successfully!");
  };

  if (!apiKey || !mapReady) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Locations</h1>
          <p className="text-muted-foreground">View and manage project site locations</p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Setup Required</h3>
              <p className="text-sm text-muted-foreground mb-4">
                To use the map feature, you need a Mapbox API token. Get one free at{" "}
                <a
                  href="https://mapbox.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  mapbox.com
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mapbox API Token</label>
              <Input
                type="text"
                placeholder="pk.eyJ1..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <button
              onClick={initializeMap}
              className="w-full bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
              disabled={!apiKey}
            >
              Initialize Map
            </button>

            <p className="text-xs text-muted-foreground">
              Note: In production, this token should be stored securely in environment variables.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Project Locations</h1>
        <p className="text-muted-foreground">View all project sites on the map</p>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-0">
          <div ref={mapContainer} className="h-[600px] rounded-lg" />
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-warning" />
              <span className="text-sm">In Progress</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-success" />
              <span className="text-sm">Completed</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-primary" />
              <span className="text-sm">Planning</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}