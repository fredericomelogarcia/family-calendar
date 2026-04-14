"use client";

import { useState, useEffect, useCallback } from "react";
import { useClerk, useUser, Show } from "@clerk/nextjs";
import { CheckoutButton } from "@clerk/nextjs/experimental";
import { Heart, Check, ArrowCounterClockwise } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface PlanData {
  id: string;
  name: string;
  price: number | null;
  priceFormatted: string | null;
  currencySymbol: string | null;
  description: string | null;
  isDefault: boolean;
  isRecurring: boolean;
  period: "month" | "annual" | null;
}

interface PlanCardProps {
  name: string;
  price: number | null;
  priceFormatted: string | null;
  currencySymbol: string | null;
  period: string | null;
  description: string | null;
  isCurrentPlan: boolean;
  isPendingCancellation: boolean;
  isDefault: boolean;
  planId?: string;
  planPeriod?: "month" | "annual";
  onSubscribe?: () => void;
  onCancel?: () => void;
  isLoading: boolean;
  onSubscriptionComplete?: () => void;
}

function PlanCard({
  name,
  price,
  priceFormatted,
  currencySymbol,
  period,
  description,
  isCurrentPlan,
  isPendingCancellation,
  isDefault,
  planId,
  planPeriod,
  onSubscribe,
  onCancel,
  isLoading,
  onSubscriptionComplete,
}: PlanCardProps) {
  const isFree = price === 0 || price === null;
  const canCheckout = planId && planPeriod && !isDefault && !isCurrentPlan;

  return (
    <div
      className={cn(
        "relative flex flex-col rounded-[--radius-lg] border p-5 sm:p-6 transition-all duration-200",
        isCurrentPlan && !isPendingCancellation
          ? "border-primary bg-primary/5 shadow-md"
          : isPendingCancellation
            ? "border-border bg-surface hover:border-primary/30 hover:shadow-sm"
            : !isFree
              ? "border-primary/30 bg-surface hover:border-primary/50 hover:shadow-md"
              : "border-border bg-surface hover:border-border/80"
      )}
    >
      {/* Active badge */}
      {isCurrentPlan && !isPendingCancellation && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-[--radius-full] bg-primary text-white text-xs font-semibold shadow-sm">
            <Check size={12} weight="bold" />
            Active
          </span>
        </div>
      )}

      {/* Cancelling badge */}
      {isPendingCancellation && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-[--radius-full] bg-text-tertiary text-white text-xs font-semibold shadow-sm">
            Cancelling
          </span>
        </div>
      )}

      {/* Plan name */}
      <h3 className="text-lg font-bold font-[family-name:var(--font-heading)] text-text-primary">
        {name}
      </h3>

      {/* Description */}
      {description && (
        <p className="mt-2 text-sm text-text-secondary leading-relaxed">
          {description}
        </p>
      )}

      {/* Price */}
      <div className="mt-5 sm:mt-6 flex items-baseline justify-center gap-1">
        <span className="text-4xl font-bold font-[family-name:var(--font-heading)] text-text-primary">
          {currencySymbol || "$"}{price !== null ? (price === 0 ? 0 : priceFormatted || price) : 0}
        </span>
        {period && !isFree && (
          <div className="flex flex-col ml-1">
            <span className="text-sm text-text-secondary font-medium">
              /{period}
            </span>
          </div>
        )}
      </div>

      {/* Sub-description under price */}
      {!isFree ? (
        <p className="mt-1 text-xs text-text-tertiary text-center">
          Only billed {period === "annual" ? "annually" : "monthly"}
        </p>
      ) : (
        <p className="mt-1 text-xs text-transparent">&nbsp;</p>
      )}

      {/* Spacer to push button to bottom */}
      <div className="flex-1" />

      {/* CTA button */}
      <div className="mt-5 sm:mt-6">
        {isDefault && !isCurrentPlan ? (
          <div className="py-2.5 px-4 text-center text-sm font-medium text-text-tertiary rounded-[--radius-lg] border border-border">
            Always free
          </div>
        ) : isPendingCancellation ? (
          <Button
            variant="primary"
            size="md"
            onClick={onSubscribe}
            loading={isLoading}
            className="w-full"
          >
            <ArrowCounterClockwise size={16} />
            Resubscribe
          </Button>
        ) : isCurrentPlan && !isDefault ? (
          <Button
            variant="secondary"
            size="md"
            onClick={onCancel}
            loading={isLoading}
            className="w-full"
          >
            Cancel support
          </Button>
        ) : isCurrentPlan && isDefault ? (
          <div className="py-2.5 px-4 text-center text-sm font-medium text-text-tertiary rounded-[--radius-lg] border border-border">
            Current plan
          </div>
        ) : canCheckout ? (
          <Show when="signed-in">
            <CheckoutButton
              planId={planId}
              planPeriod={planPeriod}
              onSubscriptionComplete={onSubscriptionComplete}
              newSubscriptionRedirectUrl="/support"
            >
              <Button
                variant="primary"
                size="md"
                className="w-full"
              >
                <Heart size={16} weight="fill" />
                Support Zawly Calendar
              </Button>
            </CheckoutButton>
          </Show>
        ) : (
          <Button
            variant="primary"
            size="md"
            disabled
            className="w-full"
          >
            <Heart size={16} weight="fill" />
            Support Zawly Calendar
          </Button>
        )}
      </div>
    </div>
  );
}

export function CustomPricingTable() {
  const { isLoaded, user } = useUser();
  const clerk = useClerk();
  const [isLoading, setIsLoading] = useState(false);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [subscribedPlanId, setSubscribedPlanId] = useState<string | null>(null);
  const [pendingCancellation, setPendingCancellation] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Fetch available plans from Clerk
      const plansResponse = await clerk.billing.getPlans();
      const planData: PlanData[] = plansResponse.data.map((plan) => {
        const fee = plan.fee;
        const annualFee = plan.annualFee;
        const monthlyPrice = fee
          ? fee.amount / 100
          : 0;
        const priceFormatted = fee ? fee.amountFormatted : null;
        const currencySymbol = fee ? "$" : null;

        return {
          id: plan.id,
          name: plan.name,
          price: monthlyPrice,
          priceFormatted,
          currencySymbol,
          description: plan.isDefault && !plan.description
            ? "Thanks for being part of the Zawly Calendar community — we're glad you're here!"
            : plan.description,
          isDefault: plan.isDefault,
          isRecurring: plan.isRecurring,
          period: fee ? "month" : annualFee ? "annual" : null,
        };
      });
      setPlans(planData);

      // Fetch current subscription
      try {
        const subscription = await clerk.billing.getSubscription({});
        setSubscriptionId(subscription.id);
        // Find the active paid plan from subscription items
        const paidItem = subscription.subscriptionItems.find(
          (item) => item.plan && !item.plan.isDefault
        );
        if (paidItem) {
          setSubscribedPlanId(paidItem.plan.id);
          // Check if subscription has been cancelled but is still in grace period
          setPendingCancellation(paidItem.canceledAt !== null);
        } else {
          setSubscribedPlanId(null);
          setPendingCancellation(false);
        }
      } catch {
        // No subscription exists - user is on free plan
        setSubscribedPlanId(null);
        setSubscriptionId(null);
        setPendingCancellation(false);
      }

      setDataLoaded(true);
    } catch (error) {
      console.error("Error fetching billing data:", error);
      // Fallback to hardcoded plans if API fails
      setPlans([
        {
          id: "free",
          name: "Free",
          price: 0,
          priceFormatted: "0",
          currencySymbol: "$",
          description: "Thanks for being part of the Zawly Calendar community — we're glad you're here!",
          isDefault: true,
          isRecurring: false,
          period: null,
        },
        {
          id: "supporter",
          name: "Supporter",
          price: 5,
          priceFormatted: "5",
          currencySymbol: "$",
          description:
            "Help us keep the lights on and the app free for every family in the world.",
          isDefault: false,
          isRecurring: true,
          period: "month",
        },
      ]);
      setDataLoaded(true);
    }
  }, [clerk.billing]);

  useEffect(() => {
    if (isLoaded) {
      fetchData();
    }
  }, [isLoaded, fetchData]);

  const handleSubscriptionComplete = () => {
    fetchData();
    showToast("success", "Thank you for supporting Zawly Calendar! 💚");
  };

  const handleResubscribe = async (planId: string, period: "month" | "annual") => {
    // Use CheckoutButton for resubscribe as well
    // This will be handled by the CheckoutButton component
    console.log("Resubscribing to plan:", planId, period);
  };

  const handleCancel = async () => {
    setIsLoading(true);
    try {
      const subscription = await clerk.billing.getSubscription({});
      const paidItem = subscription.subscriptionItems.find(
        (item) => !item.plan.isDefault
      );
      if (paidItem && paidItem.cancel) {
        await paidItem.cancel({});
        showToast("success", "Support plan cancelled. You can re-subscribe anytime.");
      }
      await fetchData();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      showToast("error", "Failed to cancel. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || !dataLoaded) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl w-full">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="rounded-[--radius-lg] border border-border p-5 sm:p-6 animate-pulse"
          >
            <div className="h-5 w-20 bg-surface-alt rounded" />
            <div className="mt-5 h-10 w-24 bg-surface-alt rounded" />
            <div className="mt-5 h-10 w-full bg-surface-alt rounded-[--radius-lg]" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl w-full">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          name={plan.name}
          price={plan.price}
          priceFormatted={plan.priceFormatted}
          currencySymbol={plan.currencySymbol}
          period={plan.period}
          description={plan.description}
          isCurrentPlan={subscribedPlanId === plan.id || (plan.isDefault && !subscribedPlanId)}
          isPendingCancellation={subscribedPlanId === plan.id && pendingCancellation}
          isDefault={plan.isDefault}
          planId={plan.id}
          planPeriod={plan.period || undefined}
          onSubscribe={
            plan.isRecurring && subscribedPlanId === plan.id && pendingCancellation
              ? () => handleResubscribe(plan.id, plan.period || "month")
              : undefined
          }
          onCancel={subscribedPlanId === plan.id ? handleCancel : undefined}
          isLoading={isLoading}
          onSubscriptionComplete={handleSubscriptionComplete}
        />
      ))}
    </div>
  );
}
