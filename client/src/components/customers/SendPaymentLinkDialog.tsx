import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { adminCustomerInvoices } from "@/services/adminCustomerInvoicesApi";
import {
  adminCustomerPaymentLink,
  type CustomerPaymentLinkDuration,
  type CustomerPaymentLinkPayload,
  type CustomerPaymentLinkType,
} from "@/services/adminCustomerPaymentLinkApi";
import { toast } from "sonner";

const DURATION_OPTIONS: Array<{ value: CustomerPaymentLinkDuration; label: string }> = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

function extractPaymentLinkFromResponse(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const nested = root.data;
  if (nested && typeof nested === "object") {
    const link = (nested as Record<string, unknown>).payment_link;
    if (typeof link === "string" && link.trim().length > 0) return link.trim();
  }
  if (typeof root.payment_link === "string" && root.payment_link.trim().length > 0) {
    return root.payment_link.trim();
  }
  return null;
}

export interface SendPaymentLinkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  onSuccess?: () => void;
}

export function SendPaymentLinkDialog({
  open,
  onOpenChange,
  customerId,
  customerName,
  customerEmail,
  onSuccess,
}: SendPaymentLinkDialogProps) {
  const [amount, setAmount] = useState("");
  const [paymentType, setPaymentType] = useState<CustomerPaymentLinkType>("one_time");
  const [duration, setDuration] = useState<CustomerPaymentLinkDuration>("monthly");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessView, setShowSuccessView] = useState(false);
  const [successPaymentLink, setSuccessPaymentLink] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setPaymentType("one_time");
      setDuration("monthly");
      setDescription("");
      setSubmitting(false);
      setShowSuccessView(false);
      setSuccessPaymentLink(null);
    }
  }, [open]);

  function handleClose() {
    const hadSuccess = showSuccessView;
    onOpenChange(false);
    if (hadSuccess) onSuccess?.();
  }

  function buildPayload(parsedAmount: number): CustomerPaymentLinkPayload {
    const desc = description.trim();
    if (paymentType === "subscription") {
      return {
        amount: parsedAmount,
        payment_type: "subscription",
        duration,
        description: desc,
        label: desc,
      };
    }
    return {
      amount: parsedAmount,
      payment_type: "one_time",
      description: desc,
      label: desc,
    };
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!customerId) {
      toast.error("Missing customer id.");
      return;
    }
    const parsed = Number(amount);
    if (!amount.trim() || !Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Please enter a valid payment amount.");
      return;
    }
    const desc = description.trim();
    if (!desc) {
      toast.error("Please enter a description.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await adminCustomerPaymentLink(customerId, buildPayload(parsed));
      setSuccessPaymentLink(extractPaymentLinkFromResponse(res));
      setShowSuccessView(true);
    } catch (err: unknown) {
      const ax = err as {
        response?: { data?: { message?: string; errors?: Record<string, string[]> } };
      };
      const data = ax?.response?.data;
      const msg = data?.message;
      const firstFieldError = data?.errors ? Object.values(data.errors).flat()[0] : undefined;
      toast.error(
        typeof msg === "string" && msg.length > 0
          ? msg
          : typeof firstFieldError === "string"
            ? firstFieldError
            : "Failed to send payment link."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        {showSuccessView ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading flex items-center gap-2">
                <CheckCircle2 className="size-5 text-qiko-success shrink-0" />
                Payment link sent
              </DialogTitle>
              <DialogDescription>
                Share this payment link with {customerName}.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Payment link</Label>
              <div className="rounded-lg border border-qiko-success/25 bg-qiko-success/5 overflow-hidden">
                {successPaymentLink ? (
                  <a
                    href={successPaymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block max-h-[min(50vh,200px)] overflow-auto p-3 text-xs text-qiko-indigo hover:underline font-mono whitespace-pre-wrap break-all"
                  >
                    {successPaymentLink}
                  </a>
                ) : (
                  <p className="p-3 text-xs text-muted-foreground">
                    Payment link was not returned in the API response.
                  </p>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
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

          <div className="space-y-2">
            <Label>Payment type</Label>
            <RadioGroup
              value={paymentType}
              onValueChange={(v) => setPaymentType(v as CustomerPaymentLinkType)}
              className="grid grid-cols-2 gap-2"
              disabled={submitting}
            >
              <label
                htmlFor="payment-type-one-time"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5 has-[[data-state=checked]]:border-qiko-indigo/50 has-[[data-state=checked]]:bg-qiko-indigo/10"
              >
                <RadioGroupItem value="one_time" id="payment-type-one-time" />
                <span className="text-sm font-medium">One time</span>
              </label>
              <label
                htmlFor="payment-type-subscription"
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/50 bg-secondary/20 px-3 py-2.5 has-[[data-state=checked]]:border-qiko-indigo/50 has-[[data-state=checked]]:bg-qiko-indigo/10"
              >
                <RadioGroupItem value="subscription" id="payment-type-subscription" />
                <span className="text-sm font-medium">Subscription</span>
              </label>
            </RadioGroup>
          </div>

          {paymentType === "subscription" && (
            <div className="space-y-1.5">
              <Label htmlFor="payment-link-duration">Billing interval</Label>
              <Select
                value={duration}
                onValueChange={(v) => setDuration(v as CustomerPaymentLinkDuration)}
                disabled={submitting}
              >
                <SelectTrigger
                  id="payment-link-duration"
                  className="w-full bg-secondary/40 border-border/50"
                >
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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

          <div className="space-y-1.5">
            <Label htmlFor="payment-link-description">Description</Label>
            <Textarea
              id="payment-link-description"
              placeholder="e.g. Enterprise setup fee"
              className="min-h-[80px] resize-y bg-secondary/40 border-border/50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="gap-1.5" disabled={submitting || !customerId}>
              <Link2 className="size-3.5" />
              {submitting ? "Sending…" : "Send payment link"}
            </Button>
          </DialogFooter>
        </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
