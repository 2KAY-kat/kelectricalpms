import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Cpu, Tag, Zap, Sun, Thermometer, Shield, Phone, MapPin, Award, Users } from "lucide-react";

export default function About() {
  const appVersion = "1.0.0";

  return (
    <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground lg:text-5xl">
            About K.Electrical <span className="text-primary italic">PMS</span>
          </h1>
          <p className="text-xl text-muted-foreground mt-2">
            The next-generation document ecosystem for electrical engineering.
          </p>
        </div>
        <Badge variant="secondary" className="px-4 py-1 text-md font-mono bg-secondary/20 border-secondary/50 text-secondary-foreground flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5" />
          v{appVersion}
        </Badge>
      </div>

      {/* Company Overview Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-card/50 p-6 rounded-2xl border border-border/50 shadow-sm transition-all duration-500 hover:shadow-md">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Award className="h-8 w-8 text-primary" />
            Why K.Electrical
          </h2>
          <p className="text-muted-foreground leading-relaxed text-sm lg:text-base">
            With over 20 years of experience in electrical engineering and power solutions, we deliver reliable, 
            professional services across domestic and industrial sectors in Malawi. Our expert team is 
            committed to excellence in every project, ensuring safety and precision.
          </p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {[
              { icon: ShieldCheck, text: "Licensed Professionals" },
              { icon: Zap, text: "24/7 Emergency Support" },
              { icon: Award, text: "Competitive Pricing" },
              { icon: Users, text: "Client-Centric Focus" }
            ].map((item, idx) => (
              <li key={idx} className="flex items-center gap-2 text-[13px] text-foreground/70 font-medium">
                <item.icon className="h-3.5 w-3.5 text-primary" /> {item.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-primary/[0.03] border-primary/10 shadow-none text-center p-6 flex flex-col items-center justify-center space-y-1 group hover:bg-primary/[0.05] transition-colors">
            <div className="text-4xl font-extrabold text-primary group-hover:scale-110 transition-transform">20+</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Years Exp</div>
          </Card>
          <Card className="bg-secondary/[0.03] border-secondary/10 shadow-none text-center p-6 flex flex-col items-center justify-center space-y-1 group hover:bg-secondary/[0.05] transition-colors">
            <div className="text-4xl font-extrabold text-secondary group-hover:scale-110 transition-transform">500+</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Projects</div>
          </Card>
          <Card className="bg-emerald-500/[0.03] border-emerald-500/10 shadow-none text-center p-6 flex flex-col items-center justify-center space-y-1 md:col-span-2 group hover:bg-emerald-500/[0.05] transition-colors">
            <div className="text-4xl font-extrabold text-emerald-600 group-hover:scale-110 transition-transform">100%</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Satisfaction Rate</div>
          </Card>
        </div>
      </div>

      {/* Services Section */}
      <div className="space-y-6 pt-4">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Our Expertise</h2>
          <p className="text-muted-foreground text-sm">Beyond electricals - Comprehensive engineering solutions</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { title: "Domestic Electrical", desc: "Complete home installation & maintenance", icon: Zap },
            { title: "Industrial Electrical", desc: "Large scale facilities & commercial solutions", icon: Cpu },
            { title: "Solar & Battery", desc: "Solar panel systems & battery backups", icon: Sun },
            { title: "Domestic HVAC", desc: "Residential refrigeration & air conditioning", icon: Thermometer },
            { title: "Industrial Cooling", desc: "Advanced refrigeration for industries", icon: Shield },
            { title: "Security Systems", desc: "Professional CCTV & security infrastructure", icon: ShieldCheck },
          ].map((service, index) => (
            <Card key={index} className="group hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-card bg-card/30 backdrop-blur-sm">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-background group-hover:bg-primary/10 transition-colors border">
                  <service.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm group-hover:text-primary transition-colors">{service.title}</h3>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-snug">{service.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* PMS Section */}
      <div className="pt-10 border-t space-y-8">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold tracking-tight text-primary">K.Electrical PMS</h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold italic">Digital Engineering Hub</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-primary shadow-soft hover:shadow-card transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Cpu className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">Digital Workspace</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed text-[13px]">
              Engineered to bridge the gap between complex site work and professional corporate documentation. 
              Generate high-fidelity Invoices, Quotations, and reports instantly, anywhere.
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-secondary shadow-soft hover:shadow-card transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-secondary/10 rounded-lg">
                  <ShieldCheck className="h-5 w-5 text-secondary" />
                </div>
                <CardTitle className="text-lg">Offline-First Tech</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-muted-foreground leading-relaxed text-[13px]">
              Hybrid cloud-local architecture ensures data safety in remote locations. Changes automatically 
              sync to the Supabase cloud the moment you're back online.
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-br from-primary/[0.08] to-secondary/[0.08] border-none shadow-elevated overflow-hidden relative group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-primary/10 transition-all duration-700" />
          <CardHeader>
            <CardTitle className="text-xl">Engineering Standard Documentation</CardTitle>
            <CardDescription className="text-sm">Precision in every pixel, accuracy in every value</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <p className="text-foreground/80 leading-relaxed text-[13px] max-w-2xl">
              Every document follows strict professional engineering standards. From automated labor 
              calculations to dynamic Tax adjustments, we ensure your client-facing documents look elite.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              {[
                { label: "A4 Optimized", sub: "Print-Ready PDF" },
                { label: "Cloud Vault", sub: "Secure Persistence" },
                { label: "Map Integrated", sub: "Project Geolocation" },
                { label: "Native Suite", sub: "Cross-Platform" },
              ].map((item, i) => (
                <div key={i} className="text-center p-3 bg-background/60 backdrop-blur-md rounded-2xl border border-border/50 group/item hover:border-primary/40 transition-all duration-300 hover:-translate-y-1">
                  <div className="font-bold text-primary text-[11px] uppercase tracking-wider">{item.label}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{item.sub}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer / Contact Section */}
      <div className="pt-10 border-t flex flex-col md:flex-row justify-between gap-8 items-start md:items-center pb-8">
        <div className="space-y-4">
          <div className="text-xs font-black uppercase tracking-[0.2em] text-primary">Get In Touch</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            <div className="flex items-center gap-3 text-sm text-muted-foreground group">
              <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                <Phone className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">+265 999 121 675 / 897 644 624</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground group">
              <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                <MapPin className="h-3.5 w-3.5" />
              </div>
              <span className="font-medium">Blantyre, Malawi</span>
            </div>
          </div>
        </div>
        
        <div className="space-y-1 text-right">
          <div className="text-[11px] font-bold text-foreground">© 2026 K.ELECTRICAL & POWER ENGINEERING</div>
          <div className="text-[10px] text-muted-foreground tracking-tight">beyond electricals</div>
        </div>
      </div>
    </div>
  );
}
