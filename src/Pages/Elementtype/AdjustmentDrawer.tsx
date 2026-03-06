import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiClient } from "@/utils/apiClient";

export type AjustmentProduct = {
  bom_product: Product[];
  element_count: number;
  elements: Element[];
  element_type_name: string;
  element_type_id: number;
  bom_revision_product: Product[];
  bom_required_adjustment: Product[];
  project_id?: number;
};

export type Element = {
  bom_revision_id: number;
  drawing_revision_id: number;
  element_code: string;
  element_id: number;
  element_updated_at: string;
};

export type Product = {
  product_id: number;
  product_name: string;
  quantity: number;
  bom_id?: number;
};

// Zod schema for form validation
const bomItemSchema = z.object({
  bom_id: z.number().min(1, "BOM ID is required"),
  quantity: z.number().min(1, "Quantity must be at least 1"),
  operation: z.enum(["add", "subtract"], {
    required_error: "Operation is required",
  }),
  comment: z.string().optional(),
});

const adjustmentFormSchema = z.object({
  element_type_id: z.number().min(1, "Element type ID is required"),
  element_count: z.number().min(1, "Element count must be at least 1"),
  project_id: z.number().min(1, "Project ID is required"),
  bom: z.array(bomItemSchema).min(1, "At least one BOM item is required"),
});

type AdjustmentFormData = z.infer<typeof adjustmentFormSchema>;

export const AdjustmentDrawer = (props: AjustmentProduct) => {
  const {
    element_count,
    element_type_name,
    element_type_id,
    bom_product,
    elements,
    bom_revision_product,
    bom_required_adjustment,
  } = props;

  const navigate = useNavigate();

  const [showElements, setShowElements] = useState(false);
  const safeElements = Array.isArray(elements) ? elements : [];
  const safeBomProducts = Array.isArray(bom_product) ? bom_product : [];
  const revisionQtyById = new Map(
    (Array.isArray(bom_revision_product) ? bom_revision_product : []).map(
      (p) => [p.product_id, p.quantity],
    ),
  );

  const adjustedIds = new Set(
    (Array.isArray(bom_required_adjustment) ? bom_required_adjustment : []).map(
      (p) => p.product_id,
    ),
  );
  const { projectId } = useParams<{ projectId: string }>();
  const computedProjectId =
    props.project_id ?? (projectId ? parseInt(projectId, 10) : 0);

  // React Hook Form setup
  const form = useForm<AdjustmentFormData>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      element_type_id,
      element_count,
      project_id: computedProjectId,
      bom: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "bom",
  });

  const {
    handleSubmit,
    formState: { errors, isValid },
  } = form;

  const onSubmit = async (data: AdjustmentFormData) => {
    console.log("Adjustment data from submit ");
    console.log("Adjustment payload", data);
    try {
      const response = await apiClient.post(`/inventory-adjustment`, data);
      if (response.status === 200) {
        alert("Adjustment submitted successfully");
        navigate(`/project/${projectId}/adjustmentelementtype`);
      } else {
        alert("Failed to submit adjustment");
      }
    } catch (error) {
      console.error("Error submitting adjustment", error);
    }
  };

  const addBomItem = (product: Product) => {
    append({
      bom_id: product.bom_id || product.product_id,
      quantity: 0,
      operation: "add",
      comment: "",
    });
  };

  const removeBomItem = (index: number) => {
    remove(index);
  };

  console.log(props);
  console.log("bom_product");
  console.log(bom_product.length);

  return (
    <div className="p-2 sm:p-4 flex flex-col w-full">
      <h4 className="text-lg sm:text-xl font-semibold  text-purple-500 mb-2 sm:mb-0">
        Adjustment for {element_type_name}
      </h4>
      {/* SECTION TO DISPLAY the element count and also have expnad button to show all the element detail in grid of 3 columns  */}
      <div className="mt-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="px-2 py-1 rounded bg-purple-50 text-purple-700 border border-purple-200">
              Elements: <span className="font-semibold">{element_count}</span>
            </span>
            <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 border border-blue-200">
              BOM Products:
              <span className="font-semibold">{bom_product.length}</span>
            </span>
            <span className="px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200">
              BOM Revisions:{" "}
              <span className="font-semibold">
                {bom_revision_product.length}
              </span>
            </span>
            <span className="px-2 py-1 rounded bg-rose-50 text-rose-700 border border-rose-200">
              Adjustments:{" "}
              <span className="font-semibold">
                {bom_required_adjustment.length}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowElements((prev) => !prev);
              console.log(
                "Toggle elements clicked. count=",
                Array.isArray(elements) ? elements.length : 0,
              );
            }}
            className="px-3 py-1.5 rounded-md text-sm font-medium border bg-white hover:bg-gray-50 active:bg-gray-100 transition shadow-sm"
            aria-expanded={showElements}>
            {showElements ? "Hide elements" : "Show elements"}
          </button>
        </div>

        {showElements &&
          (safeElements.length > 0 ? (
            <div className="mt-3 max-h-96 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 pr-1">
              {safeElements.map((el) => (
                <div
                  key={el.element_id}
                  className="border rounded-md p-2 bg-white shadow-sm hover:shadow transition">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-800 truncate">
                      {el.element_code}
                    </span>
                    <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-gray-600 border">
                      ID: {el.element_id}
                    </span>
                  </div>
                  <div className="text-[11px] leading-4 text-gray-600 space-y-0.5">
                    <div>
                      <span className="text-gray-500">Drawing Rev:</span>{" "}
                      <span className="font-medium">
                        {el.drawing_revision_id}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">BOM Rev:</span>{" "}
                      <span className="font-medium">{el.bom_revision_id}</span>
                    </div>
                    <div className="truncate">
                      <span className="text-gray-500">Updated:</span>{" "}
                      <span className="font-medium">
                        {new Date(el.element_updated_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 text-sm text-gray-600 border rounded-md p-3 bg-gray-50">
              No elements to display.
            </div>
          ))}
      </div>
      {/* bom products section */}
      <div className="mt-4">
        <h4 className="text-md sm:text-lg font-semibold  text-purple-500 mb-2 sm:mb-0">
          Bom Products
        </h4>
        {safeBomProducts.length > 0 ? (
          <div className="mt-2 max-h-80 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {safeBomProducts.map((p) => {
                const isAdjusted = adjustedIds.has(p.product_id);
                const hasRevision = revisionQtyById.has(p.product_id);
                const oldQty = isAdjusted
                  ? 0
                  : hasRevision
                    ? (revisionQtyById.get(p.product_id) ?? null)
                    : null;
                const borderClass = isAdjusted
                  ? "border-rose-300"
                  : hasRevision
                    ? "border-emerald-300"
                    : "border-gray-200";
                return (
                  <div
                    key={p.product_id}
                    className={`border ${borderClass} rounded-md p-2 bg-white shadow-sm`}>
                    <div className="flex items-center justify-between">
                      <span
                        className="text-sm font-semibold text-gray-800 truncate"
                        title={p.product_name}>
                        {p.product_name}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        ID: {p.product_id}
                      </span>
                    </div>
                    <div className="mt-1 grid grid-cols-3 gap-1 text-[11px] leading-4">
                      <div className="px-1 py-1 rounded bg-blue-50 border border-blue-100 text-blue-700 text-center">
                        <div className="font-medium">New</div>
                        <div className="font-semibold">{p.quantity}</div>
                      </div>
                      <div className="px-1 py-1 rounded bg-gray-50 border border-gray-200 text-gray-700 text-center">
                        <div className="font-medium">Old</div>
                        <div className="font-semibold">{oldQty ?? "-"}</div>
                      </div>
                      <div className="px-1 py-1 rounded bg-amber-50 border border-amber-200 text-amber-800 text-center">
                        <div className="font-medium">Diff</div>
                        <div className="font-semibold">
                          {oldQty == null ? "-" : p.quantity - oldQty}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-600 border rounded-md p-3 bg-gray-50">
            No BOM products to display.
          </div>
        )}
      </div>
      {/* quantity addition section with React Hook Form */}
      <div className="mt-4">
        <h4 className="text-md sm:text-lg font-semibold  text-purple-500 mb-2 sm:mb-0">
          Quantity Addition
        </h4>
        {safeBomProducts.length > 0 ? (
          <div className="mt-2 max-h-96 overflow-y-auto pr-1">
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Available BOM Products */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">
                  Available Products
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {safeBomProducts.map((p) => {
                    const isAlreadyAdded = fields.some(
                      (field) => field.bom_id === (p.bom_id || p.product_id),
                    );
                    return (
                      <div
                        key={p.product_id}
                        className="border border-gray-200 rounded-md p-2 bg-white shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <div
                              className="text-sm font-semibold text-gray-800 truncate"
                              title={p.product_name}>
                              {p.product_name}
                            </div>
                            <div className="text-[11px] text-gray-500">
                              BOM ID: {p.bom_id || p.product_id}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => addBomItem(p)}
                            disabled={isAlreadyAdded}
                            className={`shrink-0 px-2 py-1 rounded text-[11px] font-medium border transition ${
                              isAlreadyAdded
                                ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                                : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                            }`}>
                            {isAlreadyAdded ? "Added" : "Add"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* BOM Items in Form */}
              {fields.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">
                    Adjustment Items ({fields.length})
                  </h5>
                  <div className="space-y-3">
                    {fields.map((field, index) => {
                      const product = safeBomProducts.find(
                        (p) => (p.bom_id || p.product_id) === field.bom_id,
                      );
                      return (
                        <div
                          key={field.id}
                          className="border border-gray-200 rounded-md p-3 bg-white shadow-sm">
                          <div className="flex items-center justify-between mb-3">
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-gray-800">
                                {product?.product_name ||
                                  `BOM ID: ${field.bom_id}`}
                              </div>
                              <div className="text-[11px] text-gray-500">
                                BOM ID: {field.bom_id}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeBomItem(index)}
                              className="px-2 py-1 rounded text-[11px] font-medium border bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 transition">
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {/* Operation */}
                            <div>
                              <label className="block text-[11px] text-gray-600 mb-1">
                                Operation
                              </label>
                              <select
                                {...form.register(`bom.${index}.operation`)}
                                className="w-full h-8 px-2 text-sm border rounded outline-none focus:ring-2 focus:ring-purple-200">
                                <option value="add">Add (+)</option>
                                <option value="subtract">Subtract (-)</option>
                              </select>
                            </div>

                            {/* Quantity */}
                            <div>
                              <label className="block text-[11px] text-gray-600 mb-1">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min={1}
                                step={1}
                                {...form.register(`bom.${index}.quantity`, {
                                  valueAsNumber: true,
                                })}
                                className="w-full h-8 px-2 text-sm border rounded outline-none focus:ring-2 focus:ring-purple-200"
                                placeholder="0"
                              />
                              {errors.bom?.[index]?.quantity && (
                                <div className="text-[10px] text-rose-600 mt-1">
                                  {errors.bom[index]?.quantity?.message}
                                </div>
                              )}
                            </div>

                            {/* Comment */}
                            <div>
                              <label className="block text-[11px] text-gray-600 mb-1">
                                Comment (Optional)
                              </label>
                              <input
                                type="text"
                                {...form.register(`bom.${index}.comment`)}
                                className="w-full h-8 px-2 text-sm border rounded outline-none focus:ring-2 focus:ring-purple-200"
                                placeholder="Add a note"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3">
                {fields.length === 0 && (
                  <div className="text-sm text-gray-600">
                    Add at least one product to create adjustments
                  </div>
                )}
                {errors.bom && (
                  <div className="text-sm text-rose-600">
                    {errors.bom.message}
                  </div>
                )}
                <button
                  type="submit"
                  disabled={!isValid || fields.length === 0}
                  className="px-3 py-1.5 rounded-md text-sm font-medium border bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition">
                  Submit Adjustments
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-600 border rounded-md p-3 bg-gray-50">
            No BOM products to edit.
          </div>
        )}
      </div>
    </div>
  );
};
