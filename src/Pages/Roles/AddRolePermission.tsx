import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Search,
  CheckCircle2,
  XCircle,
  ArrowLeftRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";

interface AddPermissionProps {
  onSuccess: () => void;
  role_id: number | null;
}

export interface Permission {
  permission_id: number;
  permission_name: string;
}

export interface RolePermissions {
  permissions: Permission[];
  role_id: string;
}

export default function AddRolePermission({
  onSuccess,
  role_id,
}: AddPermissionProps) {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Set<number>>(
    new Set(),
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedAvailable, setSelectedAvailable] = useState<Set<number>>(
    new Set(),
  );
  const [selectedAssigned, setSelectedAssigned] = useState<Set<number>>(
    new Set(),
  );

  const fetchRolePermission = async () => {
    try {
      const { data } = await apiClient.get(`/role-permissions/${role_id}`);
      const rolePermissionsData: RolePermissions =
        data.message === "No permissions found for this role"
          ? { permissions: [], role_id: "" }
          : data;
      setRolePermissions(
        new Set(rolePermissionsData.permissions.map((p) => p.permission_id)),
      );
    } catch (error: any) {
      console.error("Error fetching role permissions:", error);
      setError(
        error.response?.data?.message || "Failed to load role permissions.",
      );
    }
  };

  const fetchPermissions = async () => {
    try {
      const { data } = await apiClient.get("/permissions");
      setPermissions(data);
    } catch (error: any) {
      console.error("Error fetching permissions:", error);
      setError(error.response?.data?.message || "Failed to load permissions.");
    }
  };

  const handleTogglePermission = (permissionId: number) => {
    setRolePermissions((prev) => {
      const updated = new Set(prev);
      if (updated.has(permissionId)) {
        updated.delete(permissionId);
      } else {
        updated.add(permissionId);
      }
      return updated;
    });
    setSelectedAvailable(new Set());
    setSelectedAssigned(new Set());
  };

  const handleMoveSelected = (toAssigned: boolean) => {
    setRolePermissions((prev) => {
      const updated = new Set(prev);
      if (toAssigned) {
        selectedAvailable.forEach((id) => updated.add(id));
        setSelectedAvailable(new Set());
      } else {
        selectedAssigned.forEach((id) => updated.delete(id));
        setSelectedAssigned(new Set());
      }
      return updated;
    });
  };

  const handleMoveAll = (toAssigned: boolean) => {
    if (toAssigned) {
      setRolePermissions(
        new Set(filteredPermissions.map((p) => p.permission_id)),
      );
    } else {
      setRolePermissions(new Set());
    }
    setSelectedAvailable(new Set());
    setSelectedAssigned(new Set());
  };

  const filteredPermissions = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return permissions.filter((permission) =>
      permission.permission_name.toLowerCase().includes(searchLower),
    );
  }, [permissions, searchTerm]);

  const { assignedPermissions, availablePermissions } = useMemo(() => {
    const assigned = filteredPermissions.filter((permission) =>
      rolePermissions.has(permission.permission_id),
    );
    const available = filteredPermissions.filter(
      (permission) => !rolePermissions.has(permission.permission_id),
    );
    return { assignedPermissions: assigned, availablePermissions: available };
  }, [filteredPermissions, rolePermissions]);

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const payload = [{ role_id, permissions: Array.from(rolePermissions) }];
      await apiClient.put("/role-permissions", payload);
      onSuccess();
    } catch (error: any) {
      console.error("Error updating permissions:", error);
      const message =
        error.response?.data?.message || "Failed to save changes.";
      setError(message);
      toast.error(message);
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([fetchPermissions(), fetchRolePermission()])
      .catch((error) => console.error("Error during initial fetch:", error))
      .finally(() => setLoading(false));
  }, [role_id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <p className="text-xs text-muted-foreground">Loading permissions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle className="text-sm">Error</AlertTitle>
        <AlertDescription className="text-xs">{error}</AlertDescription>
      </Alert>
    );
  }

  const PermissionItem = ({
    permission,
    isAssigned,
    isSelected,
    onSelect,
    onToggle,
  }: {
    permission: Permission;
    isAssigned: boolean;
    isSelected: boolean;
    onSelect: () => void;
    onToggle: () => void;
  }) => (
    <div
      className={`group flex items-center gap-2 p-2 rounded-md transition-all cursor-pointer border ${
        isSelected
          ? "bg-accent border-primary/30"
          : "bg-card border-transparent hover:bg-accent/50"
      }`}
      onClick={onSelect}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onSelect}
        className="h-3.5 w-3.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
      />
      <span className="text-xs flex-1 truncate">
        {permission.permission_name}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        {isAssigned ? (
          <ChevronLeft className="h-3.5 w-3.5 text-destructive" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-primary" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="space-y-3 w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Manage Permissions</h2>
          <p className="text-[10px] text-muted-foreground">
            Move permissions between available and assigned lists
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saveLoading}
          size="sm"
          className="h-8 gap-1.5 text-xs"
        >
          {saveLoading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-3.5 w-3.5" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Search permissions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8 h-8 text-xs"
        />
      </div>

      {/* Transfer List */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-3">
        {/* Available Permissions */}
        <Card className="overflow-hidden">
          <CardHeader className="py-2 px-3 bg-muted/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                Available
              </CardTitle>
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
                {availablePermissions.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-1.5">
            <ScrollArea className="h-[220px] lg:h-[280px]">
              <div className="space-y-1 pr-2">
                {availablePermissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <Check className="h-6 w-6 text-primary mb-1" />
                    <p className="text-[10px] text-muted-foreground">
                      All permissions assigned!
                    </p>
                  </div>
                ) : (
                  availablePermissions.map((permission) => (
                    <PermissionItem
                      key={permission.permission_id}
                      permission={permission}
                      isAssigned={false}
                      isSelected={selectedAvailable.has(
                        permission.permission_id,
                      )}
                      onSelect={() => {
                        setSelectedAvailable((prev) => {
                          const updated = new Set(prev);
                          if (updated.has(permission.permission_id)) {
                            updated.delete(permission.permission_id);
                          } else {
                            updated.add(permission.permission_id);
                          }
                          return updated;
                        });
                      }}
                      onToggle={() =>
                        handleTogglePermission(permission.permission_id)
                      }
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Transfer Controls */}
        <div className="flex lg:flex-col items-center justify-center gap-1.5 py-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMoveAll(true)}
            disabled={availablePermissions.length === 0}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-3.5 w-3.5" />
            <ChevronRight className="h-3.5 w-3.5 -ml-2" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMoveSelected(true)}
            disabled={selectedAvailable.size === 0}
            className="h-7 w-7 p-0"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMoveSelected(false)}
            disabled={selectedAssigned.size === 0}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMoveAll(false)}
            disabled={assignedPermissions.length === 0}
            className="h-7 w-7 p-0"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <ChevronLeft className="h-3.5 w-3.5 -ml-2" />
          </Button>
        </div>

        {/* Assigned Permissions */}
        <Card className="overflow-hidden border-primary/20">
          <CardHeader className="py-2 px-3 bg-primary/5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Assigned
              </CardTitle>
              <Badge variant="default" className="text-[10px] h-5 px-1.5">
                {assignedPermissions.length}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-1.5">
            <ScrollArea className="h-[220px] lg:h-[280px]">
              <div className="space-y-1 pr-2">
                {assignedPermissions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-center">
                    <X className="h-6 w-6 text-muted-foreground mb-1" />
                    <p className="text-[10px] text-muted-foreground">
                      No permissions assigned
                    </p>
                  </div>
                ) : (
                  assignedPermissions.map((permission) => (
                    <PermissionItem
                      key={permission.permission_id}
                      permission={permission}
                      isAssigned={true}
                      isSelected={selectedAssigned.has(
                        permission.permission_id,
                      )}
                      onSelect={() => {
                        setSelectedAssigned((prev) => {
                          const updated = new Set(prev);
                          if (updated.has(permission.permission_id)) {
                            updated.delete(permission.permission_id);
                          } else {
                            updated.add(permission.permission_id);
                          }
                          return updated;
                        });
                      }}
                      onToggle={() =>
                        handleTogglePermission(permission.permission_id)
                      }
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t">
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ArrowLeftRight className="h-3 w-3" />
            {permissions.length} total
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-primary" />
            {rolePermissions.size} assigned
          </span>
        </div>
        {(selectedAvailable.size > 0 || selectedAssigned.size > 0) && (
          <p className="text-[10px] text-primary">
            {selectedAvailable.size + selectedAssigned.size} selected
          </p>
        )}
      </div>
    </div>
  );
}
