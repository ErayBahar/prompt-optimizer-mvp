import { useTheme } from "@/contexts/ThemeContext";
import { Toaster as Sonner, ToasterProps } from "sonner";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  
  return (
    <Sonner
      theme={theme as "light" | "dark" | "system"}
      className="toaster group"
      {...props}
    />
  );
};

export { Toaster };
