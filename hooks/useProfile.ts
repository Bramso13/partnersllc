import { useProfile as useProfileContext } from "@/context/ProfileContext";

export function useProfile() {
  return useProfileContext();
}

