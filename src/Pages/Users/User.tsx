import PageHeader from "@/components/ui/PageHeader";
import { UserTable } from "./UserTable";

export default function User() {
  return (
    <div className="flex flex-col gap-2 py-4 px-4">
      <div className="flex item-center justify-between">
        <PageHeader title="Users" />
      </div>
      <UserTable />
    </div>
  );
}
