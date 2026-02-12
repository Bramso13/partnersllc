"use client";

import { useMemo } from "react";

export type StrengthLevel = "weak" | "fair" | "strong" | "empty";

const strengthLabels: Record<StrengthLevel, string> = {
  empty: "",
  weak: "Faible",
  fair: "Moyen",
  strong: "Fort",
};

const strengthColors: Record<StrengthLevel, string> = {
  empty: "bg-border",
  weak: "bg-danger",
  fair: "bg-warning",
  strong: "bg-success",
};

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

/**
 * Indicateur visuel de force du mot de passe (rouge / orange / vert) basé sur zxcvbn.
 */
export function PasswordStrengthIndicator({
  password,
  className = "",
}: PasswordStrengthIndicatorProps) {
  // const { level, label, score } = useMemo(() => {
  //   if (!password || password.length === 0) {
  //     return { level: "empty" as StrengthLevel, label: strengthLabels.empty, score: 0 };
  //   }
  //   const result = zxcvbn(password);
  //   // zxcvbn score 0-4 → weak / fair / strong
  //   const level: StrengthLevel =
  //     result.score <= 1 ? "weak" : result.score <= 2 ? "fair" : "strong";
  //   return {
  //     level,
  //     label: strengthLabels[level],
  //     score: result.score + 1, // 1-5 for bar segments
  //   };
  // }, [password]);
  // if (!password || password.length === 0) {
  //   return (
  //     <div className={`flex items-center gap-2 ${className}`}>
  //       <div className="flex flex-1 gap-0.5">
  //         {[1, 2, 3, 4, 5].map((i) => (
  //           <div
  //             key={i}
  //             className="h-1 flex-1 rounded-sm bg-border transition-colors"
  //             data-strength="empty"
  //           />
  //         ))}
  //       </div>
  //     </div>
  //   );
  // }
  // return (
  //   <div className={`flex items-center gap-2 ${className}`}>
  //     <div className="flex flex-1 gap-0.5">
  //       {[1, 2, 3, 4, 5].map((i) => (
  //         <div
  //           key={i}
  //           className={`h-1 flex-1 rounded-sm transition-colors ${
  //             i <= score ? strengthColors[level] : "bg-border"
  //           }`}
  //         />
  //       ))}
  //     </div>
  //     {label && (
  //       <span
  //         className={`text-xs font-medium ${
  //           level === "weak"
  //             ? "text-danger"
  //             : level === "fair"
  //               ? "text-warning"
  //               : "text-success"
  //         }`}
  //       >
  //         {label}
  //       </span>
  //     )}
  //   </div>
  // );
}
