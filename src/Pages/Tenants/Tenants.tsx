import PageHeader from "@/components/ui/PageHeader";
import { TenantsTable } from "./TenantsTable";

export default function Tenants() {
  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex item-center justify-between">
        <PageHeader title="Tenants" />
      </div>
      <TenantsTable />
    </div>
  );
}
