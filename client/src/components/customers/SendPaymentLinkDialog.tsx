import { FormEvent, useEffect, useState } from "react";
import { Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export interface SendPaymentLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerName: string;
  customerEmail?: string;
  /** UI-only hook until API is wired */
  onSubmit?: (amount: number) => void;
}

export function SendPaymentLinkDialog({
  open,
  onOpenChange,
  customerName,
  customerEmail,
  onSubmit,
}: SendPaymentLinkDialogProps) {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setSubmitting(false);
    }
  }, [open]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = Number(amount);
    if (!amount.trim() || !Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      onSubmit?.(parsed);
      onOpenChange(false);
    }, 350);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="font-heading">Send payment link</DialogTitle>
          <DialogDescription>
            Enter the dollar amount for this customer&apos;s payment plan.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-lg border border-border/40 bg-secondary/20 px-3 py-2.5 space-y-0.5">
            <p className="text-sm font-medium text-foreground">{customerName}</p>
            {customerEmail ? (
              <p className="text-xs text-muted-foreground">{customerEmail}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="payment-link-amount">Payment plan amount (USD)</Label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <Input
                id="payment-link-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="pl-7 bg-secondary/40 border-border/50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={submitting}
                autoFocus
                required
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              This is the amount the customer will be charged on the payment link.
            </p>
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
