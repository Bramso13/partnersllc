"use client";

import { useState } from "react";
import { StepField, FieldType } from "@/types/products";
import { CustomFieldModal } from "./CustomFieldModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface CustomFieldsManagerProps {
  stepId: string;
  customFields: StepField[];
  onUpdate: (fields: StepField[]) => void;
}

export function CustomFieldsManager({
  stepId,
  customFields,
  onUpdate,
}: CustomFieldsManagerProps) {
  const [showFieldModal, setShowFieldModal] = useState(false);
  const [editingField, setEditingField] = useState<StepField | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = customFields.findIndex(
        (field) => field.id === active.id
      );
      const newIndex = customFields.findIndex((field) => field.id === over.id);

      const reorderedFields = arrayMove(customFields, oldIndex, newIndex).map(
        (field, index) => ({ ...field, position: index })
      );
      onUpdate(reorderedFields);
    }
  };

  const handleAddField = (field: StepField) => {
    onUpdate([...customFields, field]);
    setShowFieldModal(false);
  };

  const handleUpdateField = (field: StepField) => {
    if (!editingField) return;

    onUpdate(
      customFields.map((f) => (f.id === editingField.id ? field : f))
    );
    setEditingField(null);
  };

  const handleDeleteField = (fieldId: string) => {
    if (confirm("Are you sure you want to delete this field?")) {
      onUpdate(customFields.filter((f) => f.id !== fieldId));
    }
  };

  return (
    <div className="space-y-3">
      {/* Custom Fields List */}
      {customFields.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={customFields.map((f) => f.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {customFields.map((field, index) => (
                <CustomFieldItem
                  key={field.id}
                  field={field}
                  index={index}
                  onEdit={() => setEditingField(field)}
                  onDelete={() => handleDeleteField(field.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add Field Button */}
      <button
        onClick={() => setShowFieldModal(true)}
        className="w-full px-4 py-3 border-2 border-dashed border-brand-border rounded-lg text-brand-text-secondary hover:border-brand-accent hover:text-brand-accent transition-colors"
      >
        + Add Custom Field
      </button>

      {/* Field Modal */}
      {showFieldModal && (
        <CustomFieldModal
          stepId={stepId}
          onSave={handleAddField}
          onClose={() => setShowFieldModal(false)}
        />
      )}

      {editingField && (
        <CustomFieldModal
          stepId={stepId}
          field={editingField}
          onSave={handleUpdateField}
          onClose={() => setEditingField(null)}
        />
      )}
    </div>
  );
}

interface CustomFieldItemProps {
  field: StepField;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}

function CustomFieldItem({
  field,
  index,
  onEdit,
  onDelete,
}: CustomFieldItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-3 bg-brand-dark-bg/30 border border-brand-border rounded-lg"
    >
      {/* Drag Handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-brand-text-secondary hover:text-brand-text-primary"
      >
        ⋮⋮
      </button>

      {/* Field Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-brand-text-primary">
            {field.label}
          </span>
          {field.is_required && (
            <span className="text-xs text-red-400">*</span>
          )}
          <span className="px-2 py-0.5 bg-brand-accent/10 text-brand-accent rounded text-xs">
            {field.field_type}
          </span>
        </div>
        <div className="text-xs text-brand-text-secondary mt-0.5">
          Key: {field.field_key}
          {field.description && ` • ${field.description}`}
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={onEdit}
        className="text-brand-accent hover:text-brand-accent/80 text-sm font-medium"
      >
        Edit
      </button>
      <button
        onClick={onDelete}
        className="text-red-400 hover:text-red-300 text-sm font-medium"
      >
        Delete
      </button>
    </div>
  );
}
