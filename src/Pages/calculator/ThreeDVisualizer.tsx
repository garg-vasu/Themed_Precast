import { useEffect, useRef } from "react";
import * as THREE from "three";
// @ts-expect-error - OrbitControls types may not be available
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

/**
 * Theme-aware 3D visualizer for cutting stock placements.
 * - Responsive to container size
 * - OrbitControls for rotation/zoom
 * - Supports highlight for placements and leftovers
 * - Auto-adapts to light/dark theme
 */

type SheetDef = { width: number; height: number };

export type Placement3D = {
  id?: string | number;
  panel_id?: string | number;
  stock_id?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
};

export type Leftover3D = {
  stock_id?: number;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Highlight3D =
  | { type: "placement"; index: number }
  | { type: "leftover"; index: number };

// Color palette that works with both light and dark themes
const PLACEMENT_COLORS = [
  0x3b82f6, // blue-500
  0x8b5cf6, // violet-500
  0x06b6d4, // cyan-500
  0x10b981, // emerald-500
  0xf59e0b, // amber-500
  0xef4444, // red-500
  0xec4899, // pink-500
  0x6366f1, // indigo-500
];

const LEFTOVER_COLOR = 0xfde047; // yellow-300

export default function ThreeDVisualizer({
  sheet,
  placements = [],
  leftovers = [],
  highlight,
}: {
  sheet?: SheetDef | null;
  placements?: Placement3D[];
  leftovers?: Leftover3D[];
  highlight?: Highlight3D | null;
}) {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // Validate sheet
    if (!sheet || !sheet.width || !sheet.height) {
      mount.innerHTML = `
        <div class="flex items-center justify-center h-full text-muted-foreground">
          <p class="text-sm">3D preview unavailable: sheet size not provided</p>
        </div>
      `;
      return;
    }

    // Detect theme
    const isDarkMode = document.documentElement.classList.contains("dark");
    const bgColor = isDarkMode ? 0x1a1a2e : 0xfafafa;
    const sheetBaseColor = isDarkMode ? 0x2a2a3e : 0xffffff;
    const gridColor = isDarkMode ? 0x3a3a4e : 0xe5e7eb;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(bgColor, 1);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.innerHTML = "";
    mount.appendChild(renderer.domElement);

    // Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(bgColor, 100, 500);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, isDarkMode ? 0.4 : 0.6);
    scene.add(ambient);

    const directional = new THREE.DirectionalLight(
      0xffffff,
      isDarkMode ? 0.6 : 0.8
    );
    directional.position.set(50, 50, 100);
    directional.castShadow = true;
    directional.shadow.mapSize.width = 1024;
    directional.shadow.mapSize.height = 1024;
    scene.add(directional);

    const fill = new THREE.DirectionalLight(0xffffff, 0.3);
    fill.position.set(-50, -50, 50);
    scene.add(fill);

    // Root group for all geometry
    const root = new THREE.Group();
    scene.add(root);

    const sheetW = sheet.width;
    const sheetH = sheet.height;

    // Sheet base (thin plate with grid texture)
    const baseMat = new THREE.MeshStandardMaterial({
      color: sheetBaseColor,
      roughness: 0.8,
      metalness: 0.1,
    });
    const baseGeom = new THREE.BoxGeometry(sheetW, sheetH, 0.3);
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.position.set(sheetW / 2, sheetH / 2, -0.15);
    baseMesh.receiveShadow = true;
    root.add(baseMesh);

    // Grid helper on top of base
    const gridHelper = new THREE.GridHelper(
      Math.max(sheetW, sheetH),
      Math.max(10, Math.floor(Math.max(sheetW, sheetH) / 5)),
      gridColor,
      gridColor
    );
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.position.set(sheetW / 2, sheetH / 2, 0.01);
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.3;
    root.add(gridHelper);

    // Add placements (boxes)
    const placementMeshes: THREE.Mesh[] = [];
    placements.forEach((p, i) => {
      const depth =
        p.depth && p.depth > 0
          ? p.depth
          : Math.max(1, (sheetW + sheetH) * 0.02);
      const geo = new THREE.BoxGeometry(p.width, p.height, depth);

      const color = PLACEMENT_COLORS[i % PLACEMENT_COLORS.length];
      const isHighlighted =
        highlight?.type === "placement" && highlight.index === i;

      const mat = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.5,
        metalness: 0.2,
        emissive: isHighlighted ? color : 0x000000,
        emissiveIntensity: isHighlighted ? 0.3 : 0,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(p.x + p.width / 2, p.y + p.height / 2, depth / 2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      if (isHighlighted) {
        mesh.scale.set(1.02, 1.02, 1.02);
      }

      mesh.userData = { index: i, panelId: p.panel_id || p.id };
      root.add(mesh);
      placementMeshes.push(mesh);
    });

    // Add leftovers (thin highlighted plates)
    const leftoverMeshes: THREE.Mesh[] = [];
    leftovers.forEach((l, i) => {
      const geo = new THREE.BoxGeometry(l.width, l.height, 0.5);
      const isHighlighted =
        highlight?.type === "leftover" && highlight.index === i;

      const mat = new THREE.MeshStandardMaterial({
        color: LEFTOVER_COLOR,
        roughness: 0.6,
        metalness: 0.1,
        transparent: true,
        opacity: isHighlighted ? 0.9 : 0.7,
        emissive: isHighlighted ? LEFTOVER_COLOR : 0x000000,
        emissiveIntensity: isHighlighted ? 0.2 : 0,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(l.x + l.width / 2, l.y + l.height / 2, 0.25);
      mesh.castShadow = true;

      if (isHighlighted) {
        mesh.scale.set(1.02, 1.02, 1.02);
      }

      root.add(mesh);
      leftoverMeshes.push(mesh);
    });

    // Compute bounding box to frame camera
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    // Position camera
    const maxDim = Math.max(size.x, size.y, 1);
    const fitOffset = 1.5;
    const fov = camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / (2 * Math.tan(fov / 2))) * fitOffset;

    camera.position.set(
      center.x + cameraZ * 0.3,
      center.y - cameraZ * 0.4,
      cameraZ * 0.8
    );
    camera.up.set(0, 0, 1);
    camera.lookAt(center);

    // Resize handler
    function resizeRendererToDisplaySize() {
      if (!mount) return false;
      const width = mount.clientWidth;
      const height = Math.max(200, mount.clientHeight || 350);
      const dpr = Math.min(2, window.devicePixelRatio || 1);

      const needResize =
        renderer.domElement.width !== Math.floor(width * dpr) ||
        renderer.domElement.height !== Math.floor(height * dpr);

      if (needResize) {
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
      return needResize;
    }

    // Orbit controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.copy(center);
    controls.update();
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.panSpeed = 0.8;
    controls.zoomSpeed = 1.2;
    controls.minDistance = maxDim * 0.3;
    controls.maxDistance = maxDim * 5;

    // Animation loop
    let mounted = true;

    function animate() {
      if (!mounted) return;
      controls.update();
      resizeRendererToDisplaySize();
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    }

    rafRef.current = requestAnimationFrame(animate);

    // ResizeObserver for responsive sizing
    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => {
        resizeRendererToDisplaySize();
      });
      ro.observe(mount);
    } catch {
      window.addEventListener("resize", resizeRendererToDisplaySize);
    }

    // Cleanup
    return () => {
      mounted = false;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      controls.dispose();

      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resizeRendererToDisplaySize);

      try {
        if (mount && renderer.domElement.parentElement === mount) {
          mount.removeChild(renderer.domElement);
        }
      } catch {
        // Ignore cleanup errors
      }

      // Dispose geometries & materials
      root.traverse((obj: THREE.Object3D) => {
        if ((obj as THREE.Mesh).geometry) {
          (obj as THREE.Mesh).geometry.dispose();
        }
        if ((obj as THREE.Mesh).material) {
          const material = (obj as THREE.Mesh).material;
          if (Array.isArray(material)) {
            material.forEach((m) => m.dispose());
          } else {
            material.dispose();
          }
        }
      });

      renderer.dispose();
      scene.clear();
    };
  }, [sheet, placements, leftovers, highlight]);

  return (
    <div
      ref={mountRef}
      className="w-full h-[350px] md:h-[400px] rounded-lg overflow-hidden transition-colors"
      style={{ touchAction: "none" }}
    />
  );
}
