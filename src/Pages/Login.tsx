import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Building2,
  Boxes,
  Truck,
  ClipboardCheck,
  Shield,
  Eye,
  EyeOff,
  ArrowLeft,
  Monitor,
} from "lucide-react";

const baseUrl = import.meta.env.VITE_API_URL;

// schema of the form
const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  ip: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ActiveDevice {
  expires_at: string;
  ip_address: string;
  login_time: string;
  session_id: string;
}

interface DeviceLimitResponse {
  active_devices: ActiveDevice[];
  current_devices: number;
  error: string;
  max_devices: number;
  message: string;
  requires_logout: boolean;
}

// Feature card component for the left panel
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 transition-all hover:bg-white/10">
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <h3 className="font-medium text-white text-sm">{title}</h3>
        <p className="text-white/70 text-xs mt-0.5">{description}</p>
      </div>
    </div>
  );
}

// Animated building blocks background
function BuildingBlocksPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden opacity-10">
      <svg
        className="absolute w-full h-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="grid"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <rect
              width="60"
              height="60"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Floating construction elements */}
      <div
        className="absolute top-20 left-10 w-20 h-32 bg-white/20 rounded animate-pulse"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="absolute top-40 left-40 w-16 h-24 bg-white/15 rounded animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />
      <div
        className="absolute bottom-32 left-20 w-24 h-16 bg-white/10 rounded animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute top-1/3 right-20 w-14 h-40 bg-white/15 rounded animate-pulse"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="absolute bottom-20 right-10 w-28 h-20 bg-white/10 rounded animate-pulse"
        style={{ animationDelay: "2s" }}
      />
    </div>
  );
}

export default function Login() {
  const [isLoadingIp, setIsLoadingIp] = useState(true);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([]);
  const [loggingOutDeviceId, setLoggingOutDeviceId] = useState<string | null>(
    null,
  );
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
      ip: "",
    },
  });

  useEffect(() => {
    const fetchIp = async () => {
      try {
        const response = await fetch("https://api.ipify.org?format=json");
        const data = await response.json();
        setValue("ip", data.ip);
      } catch (error) {
        console.error("Failed to fetch IP address:", error);
        toast.error("Failed to initialize security check. Please try again.");
      } finally {
        setIsLoadingIp(false);
      }
    };
    fetchIp();
  }, [setValue]);

  const navigate = useNavigate();

  const onSubmit = async (data: FormData) => {
    if (isLoadingIp) {
      toast.error("Loading security check... Please wait.");
      return;
    }
    try {
      const response = await axios.post(`${baseUrl}/login`, data);
      if (response.status === 200) {
        const accessToken = response.data.access_token;
        const refreshToken = response.data.refresh_token;
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);
        toast.success("Logged in successfully. Redirecting...");
        navigate("/");
      } else {
        toast.error(
          response.data?.error ||
            response.data?.message ||
            "Login failed. Please try again.",
        );
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Handle 409 status code - device limit reached
        if (error.response?.status === 409) {
          const deviceLimitData = error.response.data as DeviceLimitResponse;
          if (
            deviceLimitData.active_devices &&
            deviceLimitData.active_devices.length > 0
          ) {
            setActiveDevices(deviceLimitData.active_devices);
            setShowDeviceList(true);
            toast.error(
              deviceLimitData.message || "Maximum device limit reached",
            );
          } else {
            toast.error(
              deviceLimitData.error ||
                deviceLimitData.message ||
                "Maximum device limit reached",
            );
          }
        } else {
          toast.error(
            (error.response?.data as { error?: string; message?: string })
              ?.error ||
              (error.response?.data as { message?: string })?.message ||
              "Unable to login. Please check your credentials.",
          );
        }
      } else {
        toast.error("Unexpected error. Please try again.");
      }
    }
  };

  const handleLogoutDevice = async (sessionId: string) => {
    setLoggingOutDeviceId(sessionId);
    try {
      const response = await axios.post(`${baseUrl}/logout-device`, {
        session_id: sessionId,
      });
      if (response.status === 200 || response.status === 204) {
        toast.success("Device logged out successfully. Please login again.");
        // Reset state and show login form
        setShowDeviceList(false);
        setActiveDevices([]);
        reset();
      } else {
        toast.error("Failed to logout device. Please try again.");
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        toast.error(
          (error.response?.data as { error?: string; message?: string })
            ?.error ||
            (error.response?.data as { message?: string })?.message ||
            "Failed to logout device. Please try again.",
        );
      } else {
        toast.error("Unexpected error. Please try again.");
      }
    } finally {
      setLoggingOutDeviceId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Device list view
  if (showDeviceList) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 py-8">
        <Card className="w-full max-w-2xl flex flex-col bg-card/95 backdrop-blur-sm border-border/50 shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <Monitor className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-xl">Active Devices</CardTitle>
                <CardDescription>
                  Device limit reached. Remove a device to continue.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {activeDevices.map((device, index) => (
                <div
                  key={device.session_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors group"
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Monitor className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">Device {index + 1}</span>
                        <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
                          {device.ip_address}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-1">
                        <div>
                          <span className="text-xs">Login:</span>{" "}
                          <span className="text-foreground/80">
                            {formatDate(device.login_time)}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs">Expires:</span>{" "}
                          <span className="text-foreground/80">
                            {formatDate(device.expires_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleLogoutDevice(device.session_id)}
                    disabled={loggingOutDeviceId === device.session_id}
                    className="ml-4 flex-shrink-0"
                  >
                    {loggingOutDeviceId === device.session_id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      "Remove"
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setShowDeviceList(false);
                setActiveDevices([]);
                reset();
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main login view with split screen
  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel - Branding & Features (hidden on mobile) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 overflow-hidden">
        <BuildingBlocksPattern />

        <div className="relative z-10 flex flex-col justify-between w-full p-8 xl:p-12">
          {/* Logo & Branding */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-white">Precast</h1>
                <p className="text-white/70 text-sm">Element Management</p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 flex flex-col justify-center max-w-lg">
            <h2 className="text-3xl xl:text-4xl font-semibold text-white mb-4 leading-tight">
              Streamline Your Precast Construction Workflow
            </h2>
            <p className="text-white/80 text-base xl:text-lg mb-8">
              From production planning to site erection, manage every precast
              element with precision and efficiency.
            </p>

            {/* Feature Cards */}
            <div className="grid gap-3">
              <FeatureCard
                icon={Boxes}
                title="Element Tracking"
                description="Track elements from casting to erection in real-time"
              />
              <FeatureCard
                icon={Truck}
                title="Dispatch Management"
                description="Coordinate deliveries and manage logistics efficiently"
              />
              <FeatureCard
                icon={ClipboardCheck}
                title="Quality Control"
                description="Ensure compliance with built-in approval workflows"
              />
              <FeatureCard
                icon={Shield}
                title="Role-Based Access"
                description="Secure access control for your entire team"
              />
            </div>
          </div>

          {/* Footer Stats */}
          <div className="flex gap-8 pt-6 border-t border-white/20">
            <div>
              <p className="text-2xl font-semibold text-white">500+</p>
              <p className="text-white/70 text-sm">Projects Managed</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">50K+</p>
              <p className="text-white/70 text-sm">Elements Tracked</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">99.9%</p>
              <p className="text-white/70 text-sm">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <Building2 className="w-7 h-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">Precast</h1>
              <p className="text-muted-foreground text-sm">
                Element Management
              </p>
            </div>
          </div>

          {/* Login Card */}
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>
                Sign in to your account to continue managing your precast
                projects
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <CardContent className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    {...register("email")}
                    type="email"
                    placeholder="you@company.com"
                    className="h-11"
                    autoComplete="email"
                    aria-invalid={errors.email ? "true" : "false"}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="inline-block w-1 h-1 bg-destructive rounded-full" />
                      {errors.email.message}
                    </p>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="text-sm text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="h-11 pr-10"
                      autoComplete="current-password"
                      {...register("password")}
                      aria-invalid={errors.password ? "true" : "false"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <span className="inline-block w-1 h-1 bg-destructive rounded-full" />
                      {errors.password.message}
                    </p>
                  )}
                </div>

                <input type="hidden" {...register("ip")} />
              </CardContent>

              <CardFooter className="flex-col gap-4 pt-2">
                <Button
                  type="submit"
                  className="w-full h-11 text-base"
                  disabled={isSubmitting || isLoadingIp}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : isLoadingIp ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Initializing...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>

                {/* Security Note */}
                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3 w-3" />
                  <span>Secured with enterprise-grade encryption</span>
                </div>
              </CardFooter>
            </form>
          </Card>

          {/* Mobile Feature Highlights */}
          <div className="mt-8 lg:hidden">
            <p className="text-center text-sm text-muted-foreground mb-4">
              Trusted by construction teams worldwide
            </p>
            <div className="flex justify-center gap-6 text-center">
              <div>
                <p className="text-lg font-semibold text-foreground">500+</p>
                <p className="text-xs text-muted-foreground">Projects</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="text-lg font-semibold text-foreground">50K+</p>
                <p className="text-xs text-muted-foreground">Elements</p>
              </div>
              <div className="w-px bg-border" />
              <div>
                <p className="text-lg font-semibold text-foreground">99.9%</p>
                <p className="text-xs text-muted-foreground">Uptime</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
