import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogHeader,
} from "@/components/ui/dialog";
import { useEffect, useState, useCallback } from "react";
import PermissionForm from "./AddPermission";
import RoleForm from "./AddRoles";
import AddRolePermission from "./AddRolePermission";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Loader2,
  Plus,
  Shield,
  KeyRound,
  Settings2,
  Users,
  Search,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiClient } from "@/utils/apiClient";
import { toast } from "sonner";
import PageHeader from "@/components/ui/PageHeader";

export interface Role {
  role_id: number;
  role_name: string;
}

export interface Permissions {
  permissions: Permission[];
  project_id: string;
  role_id: string;
}

export interface Permission {
  permission_id: number;
  permission_name: string;
}

export default function RolePermission() {
  const [loading, setLoading] = useState<boolean>(true);
  const [permissionLoading, setPermissionLoading] = useState<boolean>(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permissions | null>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [dialogStates, setDialogStates] = useState({
    addRole: false,
    addPermission: false,
    managePermissions: false,
  });
  const [rolePermissionCounts, setRolePermissionCounts] = useState<{
    [roleId: number]: number;
  }>({});

  const fetchPermissionCount = async (roleId: number) => {
    try {
      const response = await apiClient.get(`/role-permissions/${roleId}`);
      return response.data.permissions ? response.data.permissions.length : 0;
    } catch {
      return 0;
    }
  };

  const fetchAllPermissionCounts = async (roles: Role[]) => {
    const counts: { [roleId: number]: number } = {};
    await Promise.all(
      roles.map(async (role) => {
        counts[role.role_id] = await fetchPermissionCount(role.role_id);
      }),
    );
    setRolePermissionCounts(counts);
  };

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/roles");
      setRoles(response.data);
      await fetchAllPermissionCounts(response.data);
    } catch (error: any) {
      console.error("Error fetching roles:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to load roles. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPermissions = async (roleId: number) => {
    setPermissionLoading(true);
    try {
      const response = await apiClient.get(`/role-permissions/${roleId}`);
      if (response.data.permissions) {
        setPermissions(response.data);
      } else {
        setPermissions({
          permissions: [],
          project_id: "",
          role_id: roleId.toString(),
        });
      }
    } catch (error: any) {
      console.error("Error fetching permissions:", error);
      toast.error(
        error.response?.data?.message || "Failed to load permissions.",
      );
    } finally {
      setPermissionLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const reloadData = () => {
    fetchRoles();
    setSelectedRole(null);
    setPermissions(null);
  };

  const toggleDialog = (
    dialog: "addRole" | "addPermission" | "managePermissions",
    isOpen: boolean,
  ) => {
    setDialogStates((prevState) => ({ ...prevState, [dialog]: isOpen }));
  };

  const handleRoleClick = (roleId: number) => {
    setSelectedRole(roleId);
    fetchPermissions(roleId);
  };

  const filteredRoles = roles.filter((role) =>
    role.role_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedRoleName =
    roles.find((r) => r.role_id === selectedRole)?.role_name || "";

  return (
    <div className="w-full p-4">
      {/* Header Section */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-4">
        <PageHeader title="Roles & Permissions" />

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={reloadData}
            disabled={loading}
            className="h-8 gap-1.5 text-xs"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>

          <Dialog
            open={dialogStates.addRole}
            onOpenChange={(isOpen) => toggleDialog("addRole", isOpen)}
          >
            <DialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Role</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <Shield className="h-4 w-4 text-primary" />
                  Create New Role
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Add a new role to your system.
                </DialogDescription>
              </DialogHeader>
              <RoleForm
                onSuccess={() => {
                  toggleDialog("addRole", false);
                  fetchRoles();
                  toast.success("Role created successfully!");
                }}
              />
            </DialogContent>
          </Dialog>

          <Dialog
            open={dialogStates.addPermission}
            onOpenChange={(isOpen) => toggleDialog("addPermission", isOpen)}
          >
            <DialogTrigger asChild>
              <Button
                variant="default"
                size="sm"
                className="h-8 gap-1.5 text-xs"
              >
                <KeyRound className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Add Permission</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base">
                  <KeyRound className="h-4 w-4 text-primary" />
                  Create New Permission
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Add a new permission that can be assigned to roles.
                </DialogDescription>
              </DialogHeader>
              <PermissionForm
                onSuccess={() => {
                  toggleDialog("addPermission", false);
                  if (selectedRole) fetchPermissions(selectedRole);
                  toast.success("Permission created successfully!");
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mb-4">
        <Card className="border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Total Roles
                </p>
                <p className="text-lg font-semibold text-primary">
                  {loading ? "..." : roles.length}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Selected Role
                </p>
                <p className="text-sm font-medium text-foreground truncate max-w-[100px]">
                  {selectedRoleName || "None"}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Permissions
                </p>
                <p className="text-lg font-semibold text-primary">
                  {selectedRole ? rolePermissionCounts[selectedRole] || 0 : "-"}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <KeyRound className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  Avg. Permissions
                </p>
                <p className="text-lg font-semibold text-primary">
                  {roles.length > 0
                    ? Math.round(
                        Object.values(rolePermissionCounts).reduce(
                          (a, b) => a + b,
                          0,
                        ) / roles.length,
                      ) || 0
                    : 0}
                </p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Settings2 className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Roles List */}
        <div className="lg:col-span-1">
          <Card className="h-fit lg:sticky lg:top-4">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Roles
              </CardTitle>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search roles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <ScrollArea className="h-[280px] lg:h-[380px] pr-2">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
                    <p className="text-xs text-muted-foreground">
                      Loading roles...
                    </p>
                  </div>
                ) : filteredRoles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Shield className="h-10 w-10 text-muted-foreground/30 mb-2" />
                    <p className="text-xs text-muted-foreground">
                      {searchTerm
                        ? "No roles match your search"
                        : "No roles found"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredRoles.map((role) => (
                      <div
                        key={role.role_id}
                        onClick={() => handleRoleClick(role.role_id)}
                        className={`group relative p-2.5 rounded-md cursor-pointer transition-all border ${
                          selectedRole === role.role_id
                            ? "bg-accent border-primary/30"
                            : "bg-card border-transparent hover:bg-accent/50 hover:border-border"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`h-7 w-7 rounded-full flex items-center justify-center transition-colors ${
                                selectedRole === role.role_id
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                              }`}
                            >
                              <Shield className="h-3.5 w-3.5" />
                            </div>
                            <div>
                              <p className="font-medium text-xs text-foreground">
                                {role.role_name}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {rolePermissionCounts[role.role_id] || 0}{" "}
                                permissions
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={
                              selectedRole === role.role_id
                                ? "default"
                                : "secondary"
                            }
                            className="text-[10px] h-5 px-1.5"
                          >
                            {rolePermissionCounts[role.role_id] || 0}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Permissions Display */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-2">
              <div>
                <CardTitle className="text-sm flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-primary" />
                  {selectedRole
                    ? `Permissions for ${selectedRoleName}`
                    : "Role Permissions"}
                </CardTitle>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {selectedRole
                    ? "View and manage permissions assigned to this role"
                    : "Select a role to view its permissions"}
                </p>
              </div>
              {selectedRole && (
                <Dialog
                  open={dialogStates.managePermissions}
                  onOpenChange={(isOpen) =>
                    toggleDialog("managePermissions", isOpen)
                  }
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1.5 text-xs"
                    >
                      <Settings2 className="h-3.5 w-3.5" />
                      Manage
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-full max-w-4xl max-h-[85vh] overflow-hidden">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-base">
                        <Settings2 className="h-4 w-4 text-primary" />
                        Manage Permissions
                      </DialogTitle>
                      <DialogDescription className="text-xs">
                        Configure permissions for{" "}
                        <span className="font-semibold text-foreground">
                          {selectedRoleName}
                        </span>
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                      <AddRolePermission
                        onSuccess={() => {
                          toggleDialog("managePermissions", false);
                          reloadData();
                          toast.success("Permissions updated successfully!");
                        }}
                        role_id={selectedRole}
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent className="p-3 pt-0">
              {!selectedRole ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-3">
                    <KeyRound className="h-7 w-7 text-muted-foreground/40" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    No Role Selected
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Select a role from the list to view and manage its
                    permissions
                  </p>
                </div>
              ) : permissionLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : permissions && permissions.permissions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                  {permissions.permissions.map((permission) => (
                    <div
                      key={permission.permission_id}
                      className="flex items-center gap-2 p-2 rounded-md bg-accent/50 border border-border hover:border-primary/30 transition-colors"
                    >
                      <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <KeyRound className="h-3 w-3 text-primary" />
                      </div>
                      <span className="text-xs font-medium truncate text-foreground">
                        {permission.permission_name}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                    <KeyRound className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-sm font-medium mb-1">
                    No Permissions Assigned
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs mb-3">
                    This role doesn't have any permissions yet.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleDialog("managePermissions", true)}
                    className="gap-1.5 h-7 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Assign Permissions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
