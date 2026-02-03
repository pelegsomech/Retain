import Link from "next/link";
import { Zap, ArrowRight, Shield, Clock, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <nav className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <Zap className="h-8 w-8 text-blue-500" />
            <span className="text-2xl font-bold text-white">RETAIN</span>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
              Dashboard <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </nav>

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-8">
            <Shield className="h-4 w-4" />
            AI-Native Lead Management
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Capture Leads.
            <br />
            <span className="text-blue-500">Book Appointments.</span>
          </h1>

          <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto">
            The autonomous lead-to-appointment platform for construction contractors.
            Replace fragmented agency stacks with zero-latency AI handoffs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8">
                Open Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto">
          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <Clock className="h-10 w-10 text-blue-500 mb-2" />
              <CardTitle>60-Second Escalation</CardTitle>
              <CardDescription className="text-slate-400">
                Contractor gets SMS. If no response in 60s, AI takes over.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <Phone className="h-10 w-10 text-green-500 mb-2" />
              <CardTitle>AI Voice Agent</CardTitle>
              <CardDescription className="text-slate-400">
                Retell.ai-powered calls that qualify leads and book appointments.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-white/5 border-white/10 text-white">
            <CardHeader>
              <Zap className="h-10 w-10 text-yellow-500 mb-2" />
              <CardTitle>Sub-50ms Capture</CardTitle>
              <CardDescription className="text-slate-400">
                Direct DB writes. No Zapier delays. Instant escalation trigger.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
