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
import { Loader2 } from "lucide-react";

const baseUrl = import.meta.env.VITE_API_URL;

// schema of the form
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
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

export default function Login() {
  const [isLoadingIp, setIsLoadingIp] = useState(true);
  const [showDeviceList, setShowDeviceList] = useState(false);
  const [activeDevices, setActiveDevices] = useState<ActiveDevice[]>([]);
  const [loggingOutDeviceId, setLoggingOutDeviceId] = useState<string | null>(null);
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
            "Login failed. Please try again."
        );
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        // Handle 409 status code - device limit reached
        if (error.response?.status === 409) {
          const deviceLimitData = error.response.data as DeviceLimitResponse;
          if (deviceLimitData.active_devices && deviceLimitData.active_devices.length > 0) {
            setActiveDevices(deviceLimitData.active_devices);
            setShowDeviceList(true);
            toast.error(deviceLimitData.message || "Maximum device limit reached");
          } else {
            toast.error(
              deviceLimitData.error ||
                deviceLimitData.message ||
                "Maximum device limit reached"
            );
          }
        } else {
          toast.error(
            (error.response?.data as { error?: string; message?: string })
              ?.error ||
              (error.response?.data as { message?: string })?.message ||
              "Unable to login. Please check your credentials."
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
      const response = await axios.post(
        `${baseUrl}/logout-device`,
        { session_id: sessionId }
      );
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
            "Failed to logout device. Please try again."
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

  // return section
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4">
      {showDeviceList ? (
        <Card className="w-full max-w-2xl flex flex-col">
          <CardHeader>
            <CardTitle>Active Devices</CardTitle>
            <CardDescription>
              You have reached the maximum limit of active devices. Please logout
              from one device to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {activeDevices.map((device, index) => (
                <div
                  key={device.session_id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">Device {index + 1}</span>
                      <span className="text-sm text-muted-foreground">
                        ({device.ip_address})
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <div>
                        <span className="font-medium">Login Time:</span>{" "}
                        {formatDate(device.login_time)}
                      </div>
                      <div>
                        <span className="font-medium">Expires At:</span>{" "}
                        {formatDate(device.expires_at)}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLogoutDevice(device.session_id)}
                    disabled={loggingOutDeviceId === device.session_id}
                    className="ml-4"
                  >
                    {loggingOutDeviceId === device.session_id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Logging out...
                      </>
                    ) : (
                      "Logout"
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
              Back to Login
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full max-w-sm flex"
          noValidate
        >
          <Card className="w-full flex flex-col">
            <CardHeader>
              <CardTitle>Login to your Precast account</CardTitle>
              <CardDescription>
                Enter your email below to login to your Precast account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="grid w-full items-center gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    {...register("email")}
                    type="email"
                    placeholder="m@example.com"
                    required
                    aria-invalid={errors.email ? "true" : "false"}
                  />
                  <p className="text-sm text-red-600 min-h-[20px]">
                    {errors.email?.message || "\u00A0"}
                  </p>
                </div>
                <div className="grid gap-2 w-full items-center">
                  <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <a
                      href="#"
                      className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    required
                    {...register("password")}
                    aria-invalid={errors.password ? "true" : "false"}
                  />
                  <p className="text-sm text-red-600 min-h-[20px]">
                    {errors.password?.message || "\u00A0"}
                  </p>
                </div>
                <input type="hidden" {...register("ip")} />
              </div>
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Logging in..." : "Login"}
              </Button>
              {/* <Button variant="outline" className="w-full">
            Login with Google
          </Button> */}
            </CardFooter>
          </Card>
        </form>
      )}
    </div>
  );
}
