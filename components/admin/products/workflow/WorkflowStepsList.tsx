"use client";

import { useState } from "react";
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
} from "@dnd-kit/sortable";
import { WorkflowStepConfig } from "./WorkflowConfigContent";
import { WorkflowStepCard } from "./WorkflowStepCard";

interface WorkflowStepsListProps {
  steps: WorkflowStepConfig[];
  onReorder: (steps: WorkflowStepConfig[]) => void;
  onRemove: (stepId: string) => void;
  onUpdate: (step: WorkflowStepConfig) => void;
}

export function WorkflowStepsList({
  steps,
  onReorder,
  onRemove,
  onUpdate,
}: WorkflowStepsListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((step) => step.id === active.id);
      const newIndex = steps.findIndex((step) => step.id === over.id);

      const reorderedSteps = arrayMove(steps, oldIndex, newIndex);
      onReorder(reorderedSteps);
    }
  };

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={steps.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {steps.map((step, index) => (
            <WorkflowStepCard
              key={step.id}
              step={step}
              index={index}
              onRemove={() => onRemove(step.id)}
              onUpdate={onUpdate}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
