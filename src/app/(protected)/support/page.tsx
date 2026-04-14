import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CustomPricingTable } from "@/components/support/pricing-table";
import { ContactFormButton } from "@/components/support/contact-form-button";
import { Suspense } from "react";

function SupportContent() {
  return (
    <div className="min-h-full flex items-center justify-center p-4 md:p-8 text-center">
      <div className="max-w-2xl w-full space-y-5 md:space-y-8">
        <div className="space-y-2 md:space-y-4">
          <h1 className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-3xl md:text-4xl font-bold text-transparent">
            Support Zawly Calendar
          </h1>
          <p className="text-base md:text-lg text-text-secondary">
            Zawly Calendar is and will always be free for everyone. If you find it helpful 
            and want to support the continuous development, you can do so below. Your generosity helps keep the servers running!
          </p>
        </div>

        <div className="flex w-full justify-center">
          <CustomPricingTable />
        </div>

        <div className="text-sm text-text-secondary">
          <p>The support plan is completely optional and does not unlock extra features, 
          but it is greatly appreciated!</p>
        </div>

        <ContactFormButton />
      </div>
    </div>
  );
}

export default async function SupportPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <Suspense 
      fallback={
        <div className="min-h-svh flex items-center justify-center p-8">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <p className="text-text-secondary">Loading plans...</p>
          </div>
        </div>
      }
    >
      <SupportContent />
    </Suspense>
  );
}