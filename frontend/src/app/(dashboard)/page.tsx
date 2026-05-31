import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Layers, Activity, Inbox } from "lucide-react";

export default function Home() {
  return (
    <main className="container mx-auto p-12 max-w-5xl space-y-12">
      <header className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          Design System <span className="text-primary">Showcase</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Industrial Minimal Enterprise SaaS aesthetic inspired by ClickUp and Linear.
        </p>
      </header>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-4 items-center">
          <Button>Primary Action</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold border-b pb-2">Cards & Layout</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Activity className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Production Yield</CardTitle>
              <CardDescription>Real-time metrics from the plant</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">94.2%</p>
              <p className="text-sm text-green-600 mt-1">+1.2% from yesterday</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Inbox className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Pending Orders</CardTitle>
              <CardDescription>Requires immediate allocation</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">12</p>
              <div className="mt-4 flex gap-2">
                <Button size="sm">Allocate</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Layers className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Active Batches</CardTitle>
              <CardDescription>Currently in processing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-[80%]" />
                <Skeleton className="h-4 w-[60%]" />
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
