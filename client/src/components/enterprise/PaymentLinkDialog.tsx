import { FormEvent, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link2 } from "lucide-react";
import { toast } from "sonner";

export interface PaymentLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  customerEmail: string;
  onConfirm: (amount: number) => void;
}

export function PaymentLinkDialog({
  open,
  onOpenChange,
  customerName,
  customerEmail,
  onConfirm,
}: PaymentLinkDialogProps) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setSubmitting(false);
    }
  }, [open]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const parsed = Number(amount);
    if (!Number.isFinite(parsed) || parsed < 1) {
      toast.error("Enter a valid monthly amount of at least $1.");
      return;
    }
    setSubmitting(true);
    onConfirm(parsed);
    toast.success(`Payment link will be sent to ${customerEmail}`);
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="size-4 text-qiko-indigo" />
            Send payment link
          </DialogTitle>
          <DialogDescription>
            Set the monthly subscription amount for{" "}
            <span className="font-medium text-foreground">{customerName}</span>. A payment link will
            be emailed to <span className="font-medium text-foreground">{customerEmail}</span>{" "}
            (handled by the backend when connected).
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="payment-link-amount">Monthly subscription amount (USD)</Label>
              <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="payment-link-amount"
                type="number"
                min={1}
                step={0.01}
                placeholder="0.00"
                className="pl-7"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={submitting}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="gap-1.5" disabled={submitting}>
              <Link2 className="size-3.5" />
              {submitting ? "Sending…" : "Send payment link"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
