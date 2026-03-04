"use client";

import { Check } from "lucide-react";

interface Step {
  title: string;
  subtitle: string;
}

interface WizardStepperProps {
  steps: Step[];
  activeStep: number;
  locale: string;
}

export default function WizardStepper({ steps, activeStep, locale }: WizardStepperProps) {
  const isRTL = locale === "ar";

  return (
    <div className="w-full py-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex items-start justify-between relative">
        {/* Connecting line - positioned at circle center */}
        <div
          className="absolute bg-gray-200"
          style={{
            top: "20px", // Half of circle height (40px / 2)
            left: "5%",
            right: "5%",
            height: "2px",
            zIndex: 0,
          }}
        >
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{
              width: `${(activeStep / (steps.length - 1)) * 100}%`,
              transformOrigin: isRTL ? "right" : "left",
              marginLeft: isRTL ? "auto" : "0",
              marginRight: isRTL ? "0" : "auto",
            }}
          />
        </div>

        {/* Steps - Reverse order for RTL */}
        {( steps).map((step, displayIndex) => {
          // Calculate actual index based on RTL
          const actualIndex =  displayIndex;
          const isActive = actualIndex === activeStep;
          const isCompleted = actualIndex < activeStep;

          return (
            <div
              key={actualIndex}
              className="flex flex-col items-center relative"
              style={{ flex: 1 }}
            >
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300 relative z-10 ${
                  isCompleted
                    ? "bg-primary text-white"
                    : isActive
                    ? "bg-primary text-white ring-4 ring-primary/20"
                    : "bg-white border-2 border-gray-300 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span>{actualIndex + 1}</span>
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="mt-3 text-center max-w-[120px]">
                <div
                  className={`text-sm font-semibold transition-colors ${
                    isActive || isCompleted ? "text-gray-900" : "text-gray-400"
                  }`}
                >
                  {step.title}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">{step.subtitle}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
