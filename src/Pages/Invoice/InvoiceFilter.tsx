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
import { useParams } from "react-router";
import { Input } from "@/components/ui/input";
import MultiStage from "@/components/MultiStage/MultiStage";
import type { WorkorderInvoice } from "../WorkOrder/Detail/WorkorderInvoiceTable";
import type { WorkOrder } from "../WorkOrder/WorkOrderTable";

export interface ProjectView {
  project_id: number;
  name: string;
  suspend: boolean;
}

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

export type FilterStateInvoiceFilter = {
  selectedProject: number;
  workorderid: string;
  billing_address: string;
  shipping_address: string;
  wo_date: string;
  wo_validate: string;
  total_value: number;
  contact_person: string;
  contact_email: string;
  contact_number: string;
  endclient_id: number;
  payment_status: string;
  total_paid: number;
  totalvalueFilterType: "upto" | "exact";
  totalpaidFilterType: "upto" | "exact";
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
  onFilterChange: (filter: FilterStateInvoiceFilter) => void;
  onClose: () => void;
  currentFilter?: FilterStateInvoiceFilter;
}
export default function InvoiceFilter({
  onFilterChange,
  onClose,
  currentFilter,
}: AdvanceFilterProps) {
  const [projectData, setProjectData] = useState<ProjectView[]>([]);
  const [endclientData, setEndclientData] = useState<EndClient[]>([]);

  const [workorderData, setWorkorderData] = useState<WorkOrder[]>([]);

  // Filter state
  const [selectedProject, setSelectedProject] = useState<number>(
    currentFilter?.selectedProject || 0
  );
  const [workorderid, setWorkorderid] = useState<string>(
    currentFilter?.workorderid || ""
  );
  const [endclient_id, setEndclient_id] = useState<number>(
    currentFilter?.endclient_id || 0
  );
  const [contact_person, setContact_person] = useState<string>(
    currentFilter?.contact_person || ""
  );
  const [contact_email, setContact_email] = useState<string>(
    currentFilter?.contact_email || ""
  );
  const [contact_number, setContact_number] = useState<string>(
    currentFilter?.contact_number || ""
  );
  const [payment_status, setPayment_status] = useState<string>(
    currentFilter?.payment_status || ""
  );
  const [total_paid, setTotal_paid] = useState<number>(
    currentFilter?.total_paid || 0
  );
  const [wo_date, setWo_date] = useState<string>(currentFilter?.wo_date || "");
  const [wo_validate, setWo_validate] = useState<string>(
    currentFilter?.wo_validate || ""
  );
  const [total_value, setTotal_value] = useState<number>(
    currentFilter?.total_value || 0
  );

  const [totalvalueFilterType, setTotalvalueFilterType] = useState<
    "upto" | "exact"
  >(currentFilter?.totalvalueFilterType || "exact");

  const [totalpaidFilterType, setTotalpaidFilterType] = useState<
    "upto" | "exact"
  >(currentFilter?.totalpaidFilterType || "exact");
  const [billing_address, setBilling_address] = useState<string>(
    currentFilter?.billing_address || ""
  );
  const [shipping_address, setShipping_address] = useState<string>(
    currentFilter?.shipping_address || ""
  );

  // Loading states
  const [projectLoading, setProjectLoading] = useState(false);
  const [endclientLoading, setEndclientLoading] = useState(false);
  const [workorderLoading, setWorkorderLoading] = useState(false);

  //   workorders
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchInvoices = async () => {
      try {
        const response = await apiClient.get("/work-orders/search", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setWorkorderData(response.data.data);
          setWorkorderLoading(false);
        } else {
          toast.error(response.data?.message || "Failed to fetch work orders");
          setWorkorderLoading(false);
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "work orders data"));
        }
      }
    };

    fetchInvoices();

    return () => {
      source.cancel();
    };
  }, []);

  //   fetch endclients
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchEndClients = async () => {
      setEndclientLoading(true);
      try {
        const response = await apiClient.get("/end_clients", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setEndclientData(response.data.data);
          setEndclientLoading(false);
        } else {
          toast.error(response.data?.message || "Failed to fetch end clients");
          setEndclientLoading(false);
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "end clients data"));
        }
      }
    };

    fetchEndClients();

    return () => {
      source.cancel();
    };
  }, []);

  // Fetch projects
  useEffect(() => {
    const source = axios.CancelToken.source();

    const fetchProjects = async () => {
      setProjectLoading(true);
      try {
        const response = await apiClient.get("/projects_overview", {
          cancelToken: source.token,
        });

        if (response.status === 200) {
          setProjectData(response.data.projects);
          setProjectLoading(false);
        } else {
          toast.error(response.data?.message || "Failed to fetch projects");
          setProjectLoading(false);
        }
      } catch (err: unknown) {
        if (!axios.isCancel(err)) {
          toast.error(getErrorMessage(err, "projects data"));
        }
      }
    };

    fetchProjects();

    return () => {
      source.cancel();
    };
  }, []);

  // Sync local state with currentFilter prop when it changes
  useEffect(() => {
    if (currentFilter) {
      setSelectedProject(currentFilter.selectedProject || 0);
      setWorkorderid(currentFilter.workorderid || "");
      setEndclient_id(currentFilter.endclient_id || 0);
      setContact_person(currentFilter.contact_person || "");
      setContact_email(currentFilter.contact_email || "");
      setContact_number(currentFilter.contact_number || "");
      setPayment_status(currentFilter.payment_status || "");
      setTotal_paid(currentFilter.total_paid || 0);
      setWo_date(currentFilter.wo_date || "");
      setWo_validate(currentFilter.wo_validate || "");
      setTotal_value(currentFilter.total_value || 0);
      setTotalvalueFilterType(currentFilter.totalvalueFilterType || "exact");
      setTotalpaidFilterType(currentFilter.totalpaidFilterType || "exact");
      setBilling_address(currentFilter.billing_address || "");
      setShipping_address(currentFilter.shipping_address || "");
    }
  }, [currentFilter]);

  const handleApplyFilter = () => {
    const filter: FilterStateInvoiceFilter = {
      selectedProject,
      workorderid,
      endclient_id,
      contact_person,
      contact_email,
      contact_number,
      wo_date,
      wo_validate,
      payment_status,
      total_paid,
      total_value,
      totalvalueFilterType,
      totalpaidFilterType,
      billing_address,
      shipping_address,
    };
    onFilterChange(filter);
    // Don't close - keep filter open for "Apply & Keep Open"
  };

  const handleApplyAndClose = () => {
    const filter: FilterStateInvoiceFilter = {
      selectedProject,
      workorderid,
      endclient_id,
      contact_person,
      contact_email,
      contact_number,
      wo_date,
      wo_validate,
      payment_status,
      total_paid,
      total_value,
      totalvalueFilterType,
      totalpaidFilterType,
      billing_address,
      shipping_address,
    };
    onFilterChange(filter);
    onClose();
  };

  const handleResetFilter = () => {
    setSelectedProject(0);
    setWorkorderid("");
    setEndclient_id(0);
    setContact_person("");
    setContact_email("");
    setContact_number("");
    setPayment_status("");
    setTotal_paid(0);
    setWo_date("");
    setWo_validate("");
    setTotal_value(0);
    setTotalvalueFilterType("exact");
    setTotalpaidFilterType("exact");
    setBilling_address("");
    setShipping_address("");
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
          <Label htmlFor="project_name">
            Project Name <span className="text-red-500">*</span>
          </Label>
          <Select
            value={selectedProject ? selectedProject.toString() : ""}
            disabled={projectLoading}
            onValueChange={(value) => setSelectedProject(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={projectLoading ? "Loading..." : "Select a project"}
              />
            </SelectTrigger>
            <SelectContent>
              {projectData?.map((project) => (
                <SelectItem
                  key={project.project_id}
                  value={project.project_id.toString()}
                >
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {/* endclient name */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="endclient_name">
            End Client Name <span className="text-red-500">*</span>
          </Label>
          <Select
            value={endclient_id ? endclient_id.toString() : ""}
            disabled={endclientLoading}
            onValueChange={(value) => setEndclient_id(Number(value))}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  endclientLoading ? "Loading..." : "Select a end client"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {endclientData?.map((endclient) => (
                <SelectItem key={endclient.id} value={endclient.id.toString()}>
                  {endclient.contact_person} ({endclient.organization})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* worker orfer id  */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="workorder_id">
            Workorder ID <span className="text-red-500">*</span>
          </Label>
          <Select
            value={workorderid ? workorderid.toString() : ""}
            disabled={workorderLoading}
            onValueChange={(value) => setWorkorderid(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  workorderLoading ? "Loading..." : "Select a workorder"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {workorderData?.map((workorder) => (
                <SelectItem key={workorder.id} value={workorder.id.toString()}>
                  {workorder.wo_number}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* billing address  */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="billing_address">
            Billing Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="billing_address"
            placeholder="Billing Address"
            value={billing_address}
            onChange={(e) => setBilling_address(e.target.value)}
          />
        </div>

        {/* shipping address  */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="shipping_address">
            Shipping Address <span className="text-red-500">*</span>
          </Label>
          <Input
            id="shipping_address"
            placeholder="Shipping Address"
            value={shipping_address}
            onChange={(e) => setShipping_address(e.target.value)}
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
        {/* contact email */}
        {/* contact person */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="contact_email">
            Contact Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact_email"
            placeholder="Contact Email"
            value={contact_email}
            onChange={(e) => setContact_email(e.target.value)}
          />
        </div>

        {/* contact number */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="contact_number">
            Contact Number <span className="text-red-500">*</span>
          </Label>
          <Input
            id="contact_number"
            placeholder="Contact Number"
            type="number"
            value={contact_number}
            onChange={(e) => setContact_number(e.target.value)}
          />
        </div>

        {/* total value  */}
        <div className="grid w-full items-center gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="total_value">Total Value</Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="totalvalueFilterType"
                  value="exact"
                  checked={totalvalueFilterType === "exact"}
                  onChange={() => setTotalvalueFilterType("exact")}
                  className="h-3 w-3"
                />
                <span className="text-xs">Exact</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="totalvalueFilterType"
                  value="upto"
                  checked={totalvalueFilterType === "upto"}
                  onChange={() => setTotalvalueFilterType("upto")}
                  className="h-3 w-3"
                />
                <span className="text-xs">Upto</span>
              </label>
            </div>
          </div>
          <Input
            id="total_value"
            type="number"
            placeholder="Total Value"
            value={total_value}
            onChange={(e) => setTotal_value(Number(e.target.value))}
          />
        </div>

        {/* total paid  */}
        <div className="grid w-full items-center gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="total_paid">Total Paid</Label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="totalpaidFilterType"
                  value="exact"
                  checked={totalpaidFilterType === "exact"}
                  onChange={() => setTotalpaidFilterType("exact")}
                  className="h-3 w-3"
                />
                <span className="text-xs">Exact</span>
              </label>
              <label className="flex items-center gap-1 cursor-pointer">
                <input
                  type="radio"
                  name="totalpaidFilterType"
                  value="upto"
                  checked={totalpaidFilterType === "upto"}
                  onChange={() => setTotalpaidFilterType("upto")}
                  className="h-3 w-3"
                />
                <span className="text-xs">Upto</span>
              </label>
            </div>
          </div>
          <Input
            id="total_paid"
            type="number"
            placeholder="Total Paid"
            value={total_paid}
            onChange={(e) => setTotal_paid(Number(e.target.value))}
          />
        </div>

        {/* Work Order Date */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="wo_date">Work Order Date</Label>
          <Input
            id="wo_date"
            type="date"
            value={wo_date}
            onChange={(e) => setWo_date(e.target.value)}
          />
        </div>

        {/* Work Order Valid Till */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="wo_validate">Work Order Valid Till</Label>
          <Input
            id="wo_validate"
            type="date"
            value={wo_validate}
            onChange={(e) => setWo_validate(e.target.value)}
          />
        </div>
        {/* payment status */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="payment_status">Payment Status</Label>
          <Select
            value={payment_status ? payment_status.toString() : ""}
            onValueChange={(value) => setPayment_status(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fully_paid">Fully Paid</SelectItem>
              <SelectItem value="partial_paid">Partial Paid</SelectItem>
              <SelectItem value="unpaid">Unpaid</SelectItem>
            </SelectContent>
          </Select>
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
