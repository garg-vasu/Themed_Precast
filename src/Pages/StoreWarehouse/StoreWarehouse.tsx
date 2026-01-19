import PageHeader from "@/components/ui/PageHeader";
import { StoreWareHouseTable } from "./StoreWareHouseTable";

export default function StoreWarehouse() {
  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex item-center justify-between">
        <PageHeader title="Store/Warehouse" />
      </div>
      <StoreWareHouseTable />
    </div>
  );
}
