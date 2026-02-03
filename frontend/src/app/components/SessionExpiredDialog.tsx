import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/app/components/ui/dialog';

interface SessionExpiredDialogProps {
  open: boolean;
  onLoginRedirect: () => void;
}

export function SessionExpiredDialog({ open, onLoginRedirect }: SessionExpiredDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md mx-4" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-base sm:text-lg">Session Expired</DialogTitle>
          <DialogDescription className="text-sm">
            Your session has expired. Please log in again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <button
            onClick={onLoginRedirect}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 text-sm sm:text-base rounded-lg transition"
          >
            Log in
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}