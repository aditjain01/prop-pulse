import { ReactNode } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

type DetailViewProps = {
  title: string;
  onEdit?: () => void;
  onDelete?: () => void;
  isLoading?: boolean;
  children: ReactNode;
  footer?: ReactNode;
};

export function DetailView({
  title,
  onEdit,
  onDelete,
  isLoading,
  children,
  footer,
}: DetailViewProps) {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl">{title}</CardTitle>
        <div className="flex items-center space-x-2">
          {onEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <Pencil className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              disabled={isLoading}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-pulse">Loading...</div>
          </div>
        ) : (
          children
        )}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
} 