import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/utils/apiClient";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import type { Tenant } from "../Tenants/TenantsTable";

export interface ProjectView {
  project_id: number;
  name: string;
  suspend: boolean;
}

export type FilterStateProject = {
  name: string;
  client_id: number;
  stockyard_id: number;
  start_date: string;
  end_date: string;
  subscription_start_date: string;
  subscription_end_date: string;
  type: "all" | "active" | "suspend" | "inactive" | "closed";
};

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

export type EndClient = {
  id: number;
  email: string;
  contact_person: string;
  address: string;
  attachment: string[];
  organization: string;
  cin: string;
  gst_number: string;
  phone_no: string;
  profile_picture: string;
  created_at: string;
  updated_at: string;
  created_by: number;
};

interface AdvanceFilterProps {
  onFilterChange: (filter: FilterStateProject) => void;
  onClose: () => void;
  currentFilter?: FilterStateProject;
}
export default function AdvanceProjectFilter({
  onFilterChange,
  onClose,
  currentFilter,
}: AdvanceFilterProps) {
  const [clientData, setClientData] = useState<EndClient[]>([]);

  // Filter state
  const [name, setName] = useState<string>(currentFilter?.name || "");
  const [client_id, setClient_id] = useState<number>(
    currentFilter?.client_id || 0,
  );
  const [stockyard_id, setStockyard_id] = useState<number>(
    currentFilter?.stockyard_id || 0,
  );
  const [start_date, setStart_date] = useState<string>(
    currentFilter?.start_date || "",
  );
  const [end_date, setEnd_date] = useState<string>(
    currentFilter?.end_date || "",
  );
  const [subscription_start_date, setSubscription_start_date] =
    useState<string>(currentFilter?.subscription_start_date || "");
  const [subscription_end_date, setSubscription_end_date] = useState<string>(
    currentFilter?.subscription_end_date || "",
  );
  const [type, setType] = useState<
    "all" | "active" | "suspend" | "inactive" | "closed"
  >(currentFilter?.type || "all");

  // Loading states
  const [clientLoading, setClientLoading] = useState(false);

  // Fetch clients
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchTenants = async () => {
      setClientLoading(true);
      try {
        const response = await apiClient.get("/end_clients", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setClientData(response.data.data);
          setClientLoading(false);
        } else {
          toast.error(response.data?.message || "Failed to fetch end clients");
          setClientLoading(false);
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "end clients data"));
        }
      } finally {
        setClientLoading(false);
      }
    };

    fetchTenants();

    return () => {
      source.cancel();
    };
  }, []);

  // Sync local state with currentFilter prop when it changes
  useEffect(() => {
    if (currentFilter) {
      setClient_id(currentFilter.client_id || 0);
      setName(currentFilter.name || "");
      setStockyard_id(currentFilter.stockyard_id || 0);
      setStart_date(currentFilter.start_date || "");
      setEnd_date(currentFilter.end_date || "");
      setSubscription_start_date(currentFilter.subscription_start_date || "");
      setSubscription_end_date(currentFilter.subscription_end_date || "");
      setType(currentFilter.type || "all");
    }
  }, [currentFilter]);

  const handleApplyFilter = () => {
    const filter: FilterStateProject = {
      name,
      client_id,
      stockyard_id,
      start_date,
      end_date,
      subscription_start_date,
      subscription_end_date,
      type,
    };
    onFilterChange(filter);
    // Don't close - keep filter open for "Apply & Keep Open"
  };

  const handleApplyAndClose = () => {
    const filter: FilterStateProject = {
      name,
      client_id,
      stockyard_id,
      start_date,
      end_date,
      subscription_start_date,
      subscription_end_date,
      type,
    };
    onFilterChange(filter);
    onClose();
  };

  const handleResetFilter = () => {
    setClient_id(0);
    setName("");
    setStockyard_id(0);
    setStart_date("");
    setEnd_date("");
    setSubscription_start_date("");
    setSubscription_end_date("");
    setType("all");
  };
  return (
    <div className="w-full space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Advance Filter</h2>
      </div>
      {/* filter form grid  */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Project Name */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="client_id">
            Client ID <span className="text-red-500">*</span>
          </Label>
          <Select
            value={client_id ? client_id.toString() : ""}
            disabled={clientLoading}
            onValueChange={(value) => setClient_id(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={clientLoading ? "Loading..." : "Select a client"}
              />
            </SelectTrigger>
            <SelectContent>
              {clientData?.map((client) => (
                <SelectItem
                  key={client.id}
                  value={client.id.toString()}
                >
                  {client.organization} ({client.contact_person})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* type  */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="payment_status">Payment Status</Label>
          <Select
            value={type ? type.toString() : ""}
            onValueChange={(value) =>
              setType(
                value as "all" | "active" | "suspend" | "inactive" | "closed",
              )
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspend">Suspend</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* name */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="name">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* start date */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={start_date}
            onChange={(e) => setStart_date(e.target.value)}
          />
        </div>
        {/* end date */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={end_date}
            onChange={(e) => setEnd_date(e.target.value)}
          />
        </div>
        {/* subscription start date */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="subscription_start_date">
            Subscription Start Date
          </Label>
          <Input
            id="subscription_start_date"
            type="date"
            value={subscription_start_date}
            onChange={(e) => setSubscription_start_date(e.target.value)}
          />
        </div>
        {/* subscription end date */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="subscription_end_date">Subscription End Date</Label>
          <Input
            id="subscription_end_date"
            type="date"
            value={subscription_end_date}
            onChange={(e) => setSubscription_end_date(e.target.value)}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={handleResetFilter}>
          Reset
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="outline" onClick={handleApplyFilter}>
          Apply & Keep Open
        </Button>
        <Button onClick={handleApplyAndClose}>Apply & Close</Button>
      </div>
    </div>
  );
}
