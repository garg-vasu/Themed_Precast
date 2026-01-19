import { useEffect } from "react";
import { useForm, useFieldArray, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { apiClient } from "@/utils/apiClient";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { AxiosError } from "axios";
import axios from "axios";

type PaperDialogProps = {
  onClose?: () => void;
  paper?: {
    paper_name: string;
    paper_id: number;
    questions: {
      question_text: string;
      question_id: number;
      options: {
        option_text: string;
        option_id: number;
      }[];
    }[];
  };
};

const getErrorMessage = (error: AxiosError | unknown, data: string): string => {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) {
      return "Unauthorized. Please log in.";
    }
    if (error.response?.status === 403) {
      return "Access denied. Please contact your administrator.";
    }
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again later.";
    }
    // Check both 'error' and 'message' fields in the response
    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      `Failed to ${data}.`;
    return errorMessage;
  }
  return "An unexpected error occurred. Please try again later.";
};

const questionSchema = z.object({
  question_text: z.string().min(1, "Question text is required"),
  options: z.array(z.string()).min(1, "At least one option is required"),
});

const templateSchema = z.object({
  paper_name: z.string().min(1, "Paper name is required"),
  questions: z
    .array(questionSchema)
    .min(1, "At least one question is required"),
});
type FormData = z.infer<typeof templateSchema>;

const getDefaultQuestions = (
  paper?: PaperDialogProps["paper"]
): FormData["questions"] => {
  if (!paper?.questions || paper.questions.length === 0) {
    return [{ question_text: "", options: [""] }];
  }
  return paper.questions.map((question) => ({
    question_text: question.question_text || "",
    options:
      question.options.length > 0
        ? question.options.map((option) => option.option_text || "")
        : [""],
  }));
};

type QuestionItemProps = {
  questionIndex: number;
  control: any;
  register: any;
  errors: any;
  onRemove: () => void;
  canRemove: boolean;
};

function QuestionItem({
  questionIndex,
  control,
  register,
  errors,
  onRemove,
  canRemove,
}: QuestionItemProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `questions.${questionIndex}.options` as const,
  });

  return (
    <div className="border rounded-md p-3 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="font-medium text-sm">Question {questionIndex + 1}</div>
        {canRemove && (
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={`questions.${questionIndex}.question_text`}>
          Question Text <span className="text-red-500">*</span>
        </Label>
        <Input
          id={`questions.${questionIndex}.question_text`}
          placeholder="Enter question text"
          {...register(`questions.${questionIndex}.question_text` as const)}
          aria-invalid={!!errors.questions?.[questionIndex]?.question_text}
        />
        <p className="text-sm text-red-600 min-h-[20px]">
          {errors.questions?.[questionIndex]?.question_text?.message ||
            "\u00A0"}
        </p>
      </div>
      <div className="flex items-center justify-between">
        <Label className="font-semibold text-sm">Options</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => append("")}
        >
          Add Option
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        {fields.map((optionField, optionIndex) => (
          <div key={optionField.id} className="flex items-center gap-2">
            <div className="flex-1 grid gap-1.5">
              <Input
                placeholder={`Option ${optionIndex + 1}`}
                {...register(
                  `questions.${questionIndex}.options.${optionIndex}` as const
                )}
                aria-invalid={
                  !!errors.questions?.[questionIndex]?.options?.[optionIndex]
                }
              />
              <p className="text-sm text-red-600 min-h-[20px]">
                {errors.questions?.[questionIndex]?.options?.[optionIndex]
                  ?.message || "\u00A0"}
              </p>
            </div>
            {fields.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(optionIndex)}
              >
                Remove
              </Button>
            )}
          </div>
        ))}
      </div>
      {errors.questions?.[questionIndex]?.options?.root && (
        <p className="text-sm text-red-600">
          {errors.questions[questionIndex].options?.root?.message}
        </p>
      )}
    </div>
  );
}

export default function AddPaper({ onClose, paper }: PaperDialogProps) {
  const isEditMode = !!paper;
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const getDefaultValues = (): FormData => ({
    paper_name: paper?.paper_name || "",
    questions: getDefaultQuestions(paper),
  });

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(templateSchema) as Resolver<FormData>,
    defaultValues: getDefaultValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "questions",
  });

  console.log(errors);
  // Reset form when template changes (edit mode)
  useEffect(() => {
    reset(getDefaultValues());
  }, [paper, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      let payload: any;

      if (isEditMode && paper) {
        // Edit mode: include question_id and option_id
        payload = {
          paper_name: data.paper_name,
          project_id: Number(projectId ?? 0),
          questions: data.questions.map((question, questionIndex) => {
            const originalQuestion = paper.questions[questionIndex];
            return {
              question_id: originalQuestion?.question_id,
              question_text: question.question_text,
              options: question.options.map((optionText, optionIndex) => {
                const originalOption = originalQuestion?.options[optionIndex];
                return {
                  option_id: originalOption?.option_id,
                  option_text: optionText,
                };
              }),
            };
          }),
        };
      } else {
        // Create mode: only send text fields
        payload = {
          paper_name: data.paper_name,
          project_id: Number(projectId ?? 0),
          questions: data.questions.map((question) => ({
            question_text: question.question_text,
            options: question.options,
          })),
        };
      }

      if (isEditMode) {
        const response = await apiClient.put(
          `questions/update_paper/${paper?.paper_id}`,
          payload
        );
        if (response.status === 200 || response.status === 201) {
          toast.success("Paper updated successfully!");
          if (onClose) {
            onClose();
          } else {
            navigate("/papers");
          }
        }
      } else {
        const response = await apiClient.post("/questions", payload);
        if (response.status === 200 || response.status === 201) {
          toast.success("Paper created successfully!");
          if (onClose) {
            onClose();
          } else {
            navigate("/papers");
          }
        }
      }
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(
        error,
        isEditMode ? "update paper" : "create paper"
      );
      toast.error(errorMessage);
    }
  };

  return (
    <div className="flex flex-col gap-2 py-4 ">
      <form
        onSubmit={handleSubmit(onSubmit as any)}
        className="flex flex-col gap-2"
      >
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="paper_name">
            Paper Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="paper_name"
            placeholder="Paper Name"
            {...register("paper_name")}
            aria-invalid={!!errors.paper_name}
          />
          <p className="text-sm text-red-600 min-h-[20px]">
            {errors.paper_name?.message || "\u00A0"}
          </p>
        </div>

        <div className="flex items-center justify-between mt-2">
          <Label className="font-semibold">Questions</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                question_text: "",
                options: [""],
              })
            }
          >
            Add Question
          </Button>
        </div>

        <div className="flex flex-col gap-3">
          {fields.map((field, questionIndex) => (
            <QuestionItem
              key={field.id}
              questionIndex={questionIndex}
              control={control}
              register={register}
              errors={errors}
              onRemove={() => remove(questionIndex)}
              canRemove={fields.length > 1}
            />
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (onClose) {
                onClose();
              } else {
                navigate("/papers");
              }
            }}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : isEditMode
              ? "Update Paper"
              : "Create Paper"}
          </Button>
        </div>
      </form>
    </div>
  );
}
