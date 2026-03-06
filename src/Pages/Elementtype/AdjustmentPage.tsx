import { useParams } from "react-router-dom";
import { AdjustmentDrawer, type AjustmentProduct } from "./AdjustmentDrawer";
import { useEffect, useState } from "react";
import { apiClient } from "@/utils/apiClient";
import { LoadingState } from "@/components/ui/loading-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export type Element = {
  bom_revision_id: number;
  drawing_revision_id: number;
  element_code: string;
  element_id: number;
  element_updated_at: string;
};

export type Product = {
  product_id: number;
  product_name: string;
  quantity: number;
};

export type Payment = {
  element_type_created_by: string;
  element_type_id: number;
  element_type_name: string;
  element_type_updated_at: string;
  element_type_version: string;
  project_id: number;
  elements: Element[];
  bom_product: Product[];
  bom_revision_product: Product[];
  bom_required_adjustment: Product[];
};

export default function AdjustmentPage() {
  const { projectId, element_type_id } = useParams<{
    projectId: string;
    element_type_id: string;
  }>();

  const [data, setData] = useState<Payment | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await apiClient.get(
          `/element_types_with_updated_bom/${projectId}/${element_type_id}`,
        );

        console.log("response.data", response.data);
        if (response.data) {
          setData(response.data);
        }
      } catch (err) {
        console.error("Error fetching Element Type data:", err);
        setError("Failed to load adjustment data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, element_type_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingState label="Loading adjustment data..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>No Data</CardTitle>
            <CardDescription>
              No adjustment data available for this element type.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please check that the element type exists and has BOM data
              associated with it.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const safeProps: AjustmentProduct = {
    element_type_name: data.element_type_name ?? "",
    element_type_id: data.element_type_id ?? 0,
    elements: data.elements ?? [],
    project_id: data.project_id ?? 0,
    element_count: data.elements?.length ?? 0,
    bom_product: data.bom_product ?? [],
    bom_revision_product: data.bom_revision_product ?? [],
    bom_required_adjustment: data.bom_required_adjustment ?? [],
  };

  return <AdjustmentDrawer {...safeProps} />;
}
