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

export type FilterStateEndClient = {
  email: string;
  contact_person: string;
  address: string;
  cin: string;
  gst_number: string;
  phone_no: string;
  client_id: number;
  organization: string;
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

interface AdvanceFilterProps {
  onFilterChange: (filter: FilterStateEndClient) => void;
  onClose: () => void;
  currentFilter?: FilterStateEndClient;
}
export default function AdvanceEndClientFilter({
  onFilterChange,
  onClose,
  currentFilter,
}: AdvanceFilterProps) {
  const [clientData, setClientData] = useState<Tenant[]>([]);

  // Filter state
  const [email, setEmail] = useState<string>(currentFilter?.email || "");
  const [contact_person, setContact_person] = useState<string>(
    currentFilter?.contact_person || "",
  );
  const [address, setAddress] = useState<string>(currentFilter?.address || "");
  const [cin, setCin] = useState<string>(currentFilter?.cin || "");
  const [gst_number, setGst_number] = useState<string>(
    currentFilter?.gst_number || "",
  );
  const [organization, setOrganization] = useState<string>(
    currentFilter?.organization || "",
  );
  const [client_id, setClient_id] = useState<number>(
    currentFilter?.client_id || 0,
  );
  const [phone_no, setPhone_no] = useState<string>(
    currentFilter?.phone_no || "",
  );

  // Loading states
  const [clientLoading, setClientLoading] = useState(false);

  // Fetch clients
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchTenants = async () => {
      setClientLoading(true);
      try {
        const response = await apiClient.get("/client", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setClientData(response.data.data);
          setClientLoading(false);
        } else {
          toast.error(response.data?.message || "Failed to fetch tenants");
          setClientLoading(false);
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "tenants data"));
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
      setEmail(currentFilter.email || "");
      setContact_person(currentFilter.contact_person || "");
      setAddress(currentFilter.address || "");
      setCin(currentFilter.cin || "");
      setGst_number(currentFilter.gst_number || "");
      setPhone_no(currentFilter.phone_no || "");
      setOrganization(currentFilter.organization || "");
    }
  }, [currentFilter]);

  const handleApplyFilter = () => {
    const filter: FilterStateEndClient = {
      email,
      contact_person,
      address,
      cin,
      gst_number,
      organization,
      phone_no,
      client_id,
    };
    onFilterChange(filter);
    // Don't close - keep filter open for "Apply & Keep Open"
  };

  const handleApplyAndClose = () => {
    const filter: FilterStateEndClient = {
      email,
      contact_person,
      address,
      cin,
      gst_number,
      organization,
      phone_no,
      client_id,
    };
    onFilterChange(filter);
    onClose();
  };

  const handleResetFilter = () => {
    setClient_id(0);
    setEmail("");
    setContact_person("");
    setAddress("");
    setCin("");
    setGst_number("");
    setOrganization("");
    setPhone_no("");
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
                  key={client.client_id}
                  value={client.client_id.toString()}
                >
                  {client.user.first_name} {client.user.last_name} (
                  {client.organization})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* email */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {/* organization */}

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="organization">
            Organization <span className="text-red-500">*</span>
          </Label>
          <Input
            id="organization"
            placeholder="Organization"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
          />
        </div>

        {/* contact person */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="contact_person">
            Contact Person <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact_person"
            placeholder="Contact Person"
            value={contact_person}
            onChange={(e) => setContact_person(e.target.value)}
          />
        </div>
        {/* address */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="address">
            Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="address"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* cin */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="cin">
            CIN <span className="text-red-500">*</span>
          </Label>
          <Input
            id="cin"
            placeholder="CIN"
            value={cin}
            onChange={(e) => setCin(e.target.value)}
          />
        </div>

        {/* gst number */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="gst_number">
            GST Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="gst_number"
            placeholder="GST Number"
            value={gst_number}
            onChange={(e) => setGst_number(e.target.value)}
          />
        </div>

        {/* phone no */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="phone_no">Phone No</Label>
          <Input
            id="phone_no"
            value={phone_no}
            onChange={(e) => setPhone_no(e.target.value)}
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
