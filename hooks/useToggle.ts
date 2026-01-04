import { useCallback, useState } from "react";

export function useToggle(initial = false): [boolean, () => void] {
  const [value, setValue] = useState<boolean>(initial);

  const toggle = useCallback(() => {
    setValue((v) => !v);
  }, []);

  return [value, toggle];
}


