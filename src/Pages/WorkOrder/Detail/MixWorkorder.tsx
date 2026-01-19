import { Button } from "@/components/ui/button";
import PageHeader from "@/components/ui/PageHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, List } from "lucide-react";
import { useEffect, useState } from "react";
import WorkOrderDetailPage from "./WorkOrderDetailPage";
import { WorkorderInvoiceTable } from "./WorkorderInvoiceTable";
import { toast } from "sonner";
import axios, { AxiosError } from "axios";
import { apiClient } from "@/utils/apiClient";
import { useParams } from "react-router";
import WoTimelinePage from "./WoTimelinePage";

const getErrorMessage = (error: AxiosError | unknown, data: string): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Unauthorized. Please log in.";
    }
    if (error.response?.status === 403) {
      return "Access denied. Please contact your administrator.";
    }
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again later.";
    }
    return error.response?.data?.message || `Failed to fetch ${data}.`;
  }
  return "An unexpected error occurred. Please try again later.";
};

export interface SingLeClient {
  id: number;
  wo_number: string;
  wo_date: string;
  wo_validate: string;
  total_value: number;
  contact_person: string;
  contact_email: string;
  contact_number: string;
  phone_code: number;
  payment_term: string;
  wo_description: string;
  created_at: string;
  updated_at: string;
  created_by: number;
  updated_by: string;
  material: Material[];
  wo_attachment: string[];
  endclient_id: number;
  project_id: number;
  project_name: string;
  end_client: string;
  comments: string;
  revision_no: number;
  phone_code_name: string;
  shipped_address: string;
  billed_address: string;
  created_by_name: string;
}

export interface Material {
  id: number;
  item_name: string;
  unit_rate: number;
  volume: number;
  hsn_code: number;
  volume_used: number;
  tax: number;
  revision_no: number;
  balance: number;
  tower_id: number;
  floor_id: number[];
  tower_name: string;
  floor_name: string[];
}

interface TabLink {
  id: string;
  label: string;
  number?: number;
  icon: React.ElementType;
  content: React.ReactNode;
}

export default function MixWorkorder() {
  const [activeTab, setActiveTab] = useState<string>("1");
  const [workOrder, setWorkOrder] = useState<SingLeClient | null>(null);
  const { workOrderId } = useParams();
  let tabsLinks: TabLink[] = [
    {
      id: "1",
      label: "View Work Order",
      number: 1,
      icon: List,
      content: workOrder ? (
        <WorkOrderDetailPage workOrder={workOrder} />
      ) : (
        <div>Loading...</div>
      ),
    },
    {
      id: "2",
      label: "Invoices",
      number: 0,
      icon: Clock,
      content: <WorkorderInvoiceTable />,
    },
    {
      id: "3",
      label: "Timeline",
      number: 0,
      icon: Clock,
      content: <WoTimelinePage />,
    },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchWorkOrder = async () => {
      try {
        const response = await apiClient.get(`/workorders/${workOrderId}`, {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setWorkOrder(response.data);
        } else {
          toast.error(response.data?.message || "Failed to fetch work order");
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "work order data"));
        }
      }
    };

    fetchWorkOrder();

    return () => {
      source.cancel();
    };
  }, [workOrderId]);

  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex item-center justify-between">
        <PageHeader title="Work Order Detail" />
      </div>
      {/* pills section  */}
      <div className="flex flex-col gap-2">
        {/* FOR DESKTOP and TABLET  */}

        <div className=" hidden md:flex flex-wrap gap-2">
          {tabsLinks.map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              className={activeTab === tab.id ? "text-white" : ""}
              onClick={() => handleTabChange(tab.id)}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Button>
          ))}
        </div>
        {/* for mobile  */}
        <div className="md:hidden w-full">
          <Select value={activeTab} onValueChange={handleTabChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tab" />
            </SelectTrigger>
            <SelectContent>
              {tabsLinks.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {/*content area   */}

      {tabsLinks.find((tab) => tab.id === activeTab)?.content}
    </div>
  );
}
