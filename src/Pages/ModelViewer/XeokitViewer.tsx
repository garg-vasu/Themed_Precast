import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  memo,
  useCallback,
} from "react";

interface XeokitViewerProps {
  fileUrl: string;
  fileName: string;
  onLoaded: () => void;
  onError: (error: string) => void;
}

export interface XeokitViewerHandle {
  resetCamera: () => void;
  fitModel: () => void;
  setOrtho: (ortho: boolean) => void;
}

const XeokitViewer = memo(
  forwardRef<XeokitViewerHandle, XeokitViewerProps>(
    ({ fileUrl, fileName, onLoaded, onError }, ref) => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
      const viewerRef = useRef<any>(null);
      const modelRef = useRef<any>(null);
      const navCubeRef = useRef<HTMLCanvasElement>(null);
      const initializingRef = useRef(false);

      // Detect file extension
      const getFileExtension = useCallback((name: string): string => {
        return name.substring(name.lastIndexOf(".")).toLowerCase();
      }, []);

      // Expose imperative methods
      useImperativeHandle(
        ref,
        () => ({
          resetCamera: () => {
            const viewer = viewerRef.current;
            if (!viewer) return;
            viewer.cameraFlight.flyTo({
              look: [0, 0, 0],
              eye: [0, 0, 100],
              up: [0, 1, 0],
              duration: 0.5,
            });
          },
          fitModel: () => {
            const viewer = viewerRef.current;
            if (!viewer) return;
            const scene = viewer.scene;
            if (scene) {
              viewer.cameraFlight.flyTo({ aabb: scene.aabb, duration: 0.5 });
            }
          },
          setOrtho: (ortho: boolean) => {
            const viewer = viewerRef.current;
            if (!viewer) return;
            viewer.camera.projection = ortho ? "ortho" : "perspective";
          },
        }),
        [],
      );

      useEffect(() => {
        if (!canvasRef.current || !fileUrl || initializingRef.current) return;

        let destroyed = false;
        initializingRef.current = true;

        const initViewer = async () => {
          try {
            // Dynamic import to avoid SSR issues
            const xeokit = await import("@xeokit/xeokit-sdk");

            if (destroyed) return;

            // Destroy previous viewer if exists
            if (viewerRef.current) {
              try {
                viewerRef.current.destroy();
              } catch (e) {
                // ignore
              }
              viewerRef.current = null;
              modelRef.current = null;
            }

            // Create viewer
            const viewer = new xeokit.Viewer({
              canvasId: canvasRef.current!.id,
              transparent: true,
              saoEnabled: true,
            });

            viewerRef.current = viewer;

            // Configure camera
            viewer.camera.eye = [30, 30, 30];
            viewer.camera.look = [0, 0, 0];
            viewer.camera.up = [0, 1, 0];

            // Enable SAO (Scalable Ambient Obscurance) for better depth perception
            viewer.scene.sao.enabled = true;
            viewer.scene.sao.intensity = 0.15;
            viewer.scene.sao.bias = 0.5;
            viewer.scene.sao.scale = 400;
            viewer.scene.sao.minResolution = 0;

            // NavCube plugin
            if (navCubeRef.current) {
              try {
                new xeokit.NavCubePlugin(viewer, {
                  canvasId: navCubeRef.current.id,
                  visible: true,
                  cameraFly: true,
                  cameraFitFOV: 45,
                  cameraFlyDuration: 0.5,
                } as any);
              } catch (e) {
                console.warn("NavCube failed to initialize:", e);
              }
            }

            if (destroyed) {
              viewer.destroy();
              return;
            }

            // Determine loader based on file extension
            const ext = getFileExtension(fileName);

            let loader: any;

            switch (ext) {
              case ".xkt":
                loader = new xeokit.XKTLoaderPlugin(viewer);
                break;
              case ".gltf":
              case ".glb":
                loader = new xeokit.GLTFLoaderPlugin(viewer);
                break;
              case ".obj":
                loader = new xeokit.OBJLoaderPlugin(viewer, {});
                break;
              case ".stl":
                loader = new xeokit.STLLoaderPlugin(viewer);
                break;
              case ".ifc": {
                const WebIFC = await import("web-ifc");
                const ifcApi = new WebIFC.IfcAPI();
                ifcApi.SetWasmPath("/");
                await ifcApi.Init();
                if (destroyed) return;
                loader = new xeokit.WebIFCLoaderPlugin(viewer, {
                  WebIFC,
                  IfcAPI: ifcApi,
                });
                break;
              }
              default:
                onError(`Unsupported format: ${ext}`);
                initializingRef.current = false;
                return;
            }

            // Load model -- for IFC, pass the raw ArrayBuffer via `ifc` param
            // to avoid the default data source mangling the blob URL with a cache buster
            const loadParams: any = {
              id: "userModel",
              edges: true,
              saoEnabled: true,
            };

            if (ext === ".ifc") {
              const response = await fetch(fileUrl);
              if (destroyed) return;
              const arrayBuffer = await response.arrayBuffer();
              if (destroyed) return;
              loadParams.ifc = arrayBuffer;
            } else {
              loadParams.src = fileUrl;
            }

            const model = loader.load(loadParams);

            modelRef.current = model;

            model.on("loaded", () => {
              if (destroyed) return;
              // Fly to model
              viewer.cameraFlight.flyTo(
                { aabb: viewer.scene.aabb, duration: 0.8 },
                () => {
                  if (!destroyed) {
                    onLoaded();
                  }
                },
              );
            });

            model.on("error", (errMsg: string) => {
              if (!destroyed) {
                console.error("Model load error:", errMsg);
                onError(
                  `Failed to load model: ${errMsg || "Unknown error. Ensure the file is valid."}`,
                );
              }
            });
          } catch (err: any) {
            if (!destroyed) {
              console.error("Viewer initialization error:", err);
              onError(
                `Failed to initialize 3D viewer: ${err.message || "Unknown error"}`,
              );
            }
          } finally {
            initializingRef.current = false;
          }
        };

        initViewer();

        return () => {
          destroyed = true;
          initializingRef.current = false;
          if (viewerRef.current) {
            try {
              viewerRef.current.destroy();
            } catch (e) {
              // ignore
            }
            viewerRef.current = null;
            modelRef.current = null;
          }
        };
      }, [fileUrl, fileName, onLoaded, onError, getFileExtension]);

      return (
        <div className="relative w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
          <canvas
            id="xeokit-canvas"
            ref={canvasRef}
            className="w-full h-full block"
            style={{ touchAction: "none" }}
          />

          {/* NavCube overlay */}
          <canvas
            id="xeokit-navcube"
            ref={navCubeRef}
            className="absolute top-2 right-2 z-10"
            width="150"
            height="150"
            style={{
              pointerEvents: "auto",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.08)",
            }}
          />

          {/* Grid watermark */}
          <div className="absolute bottom-3 left-3 z-10 text-[10px] text-muted-foreground/50 font-mono select-none pointer-events-none">
            xeokit 3D Viewer
          </div>
        </div>
      );
    },
  ),
);

XeokitViewer.displayName = "XeokitViewer";

export default XeokitViewer;
