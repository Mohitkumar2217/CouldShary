import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="p-8">
      <Button>Click me</Button>
      <Button variant="outline">Secondary</Button>
      <Button variant="destructive">Delete</Button> 
    </div>
  );
}