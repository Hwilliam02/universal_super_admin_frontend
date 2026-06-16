import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Package, PlusCircle } from "lucide-react";

export default function DeveloperDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            Developer Console
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Access the product registry and onboarding workflows.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-md border-gray-200 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Package className="h-5 w-5 text-primary" />
              View Products
            </CardTitle>
            <CardDescription>
              Browse registered products and manage access details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/products")}
              className="bg-primary text-white hover:bg-primary/90"
            >
              Open Registry
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-md border-gray-200 shadow-sm overflow-hidden">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <PlusCircle className="h-5 w-5 text-emerald-600" />
              Register Product
            </CardTitle>
            <CardDescription>
              Create a new product record and generate credentials.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/products/new")}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              Start Registration
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
