"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { 
  Users, 
  Plus, 
  ArrowRight, 
  X, 
  Envelope,
  Check,
  Spinner,
  Globe,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { showToast } from "@/components/ui/toast";

const MAX_FAMILY_MEMBERS = 6;

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "CA", name: "Canada" },
  { code: "AU", name: "Australia" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "NL", name: "Netherlands" },
  { code: "BE", name: "Belgium" },
  { code: "AT", name: "Austria" },
  { code: "CH", name: "Switzerland" },
  { code: "IE", name: "Ireland" },
  { code: "PT", name: "Portugal" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "DK", name: "Denmark" },
  { code: "FI", name: "Finland" },
  { code: "PL", name: "Poland" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
  { code: "JP", name: "Japan" },
  { code: "KR", name: "South Korea" },
  { code: "IN", name: "India" },
  { code: "SG", name: "Singapore" },
  { code: "NZ", name: "New Zealand" },
  { code: "ZA", name: "South Africa" },
  { code: "AE", name: "United Arab Emirates" },
];

interface PendingInvite {
  email: string;
  id: string;
}

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [step, setStep] = useState<"welcome" | "create" | "join">("welcome");
  const [familyName, setFamilyName] = useState("");
  const [country, setCountry] = useState("GB");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Email invitations during family creation
  const [invites, setInvites] = useState<string[]>([]);
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [createdInvitations, setCreatedInvitations] = useState<PendingInvite[]>([]);

  // Check if user already has a family
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.push("/sign-in");
      return;
    }

    // Check if user has a family
    fetch("/api/family")
      .then((res) => res.json())
      .then((data) => {
        if (data.hasFamily) {
          router.push("/dashboard");
        }
      })
      .catch(console.error);
  }, [user, isLoaded, router]);

  const handleCreateFamily = async () => {
    if (!familyName.trim() || familyName.length < 2) {
      showToast("error", "Family name must be at least 2 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "create", 
          familyName: familyName.trim(),
          country: country,
          inviteEmails: invites.filter(e => e.includes("@")),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.invitationCount > 0) {
          setCreatedInvitations(
            data.invitations?.map((inv: { email: string; id: string }) => ({
              email: inv.email,
              id: inv.id,
            })) || []
          );
          setShowInviteModal(true);
        } else {
          showToast("success", `Welcome to ${data.family.name}!`);
          router.push("/dashboard");
        }
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to create family");
      }
    } catch (error) {
      showToast("error", "Failed to create family");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim() || inviteCode.length !== 6) {
      showToast("error", "Please enter a valid 6-character invite code");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "join", inviteCode: inviteCode.trim().toUpperCase() }),
      });

      if (res.ok) {
        const data = await res.json();
        showToast("success", `Welcome to ${data.family.name}!`);
        router.push("/dashboard");
      } else {
        const data = await res.json();
        showToast("error", data.error || "Invalid invite code");
      }
    } catch (error) {
      showToast("error", "Failed to join family");
    } finally {
      setLoading(false);
    }
  };

  const addInviteEmail = () => {
    if (!newInviteEmail.trim() || !newInviteEmail.includes("@")) {
      showToast("error", "Please enter a valid email");
      return;
    }
    if (invites.includes(newInviteEmail.trim().toLowerCase())) {
      showToast("error", "This email is already added");
      return;
    }
    if (invites.length >= MAX_FAMILY_MEMBERS - 1) {
      showToast("error", `Maximum ${MAX_FAMILY_MEMBERS - 1} invitations`);
      return;
    }
    setInvites([...invites, newInviteEmail.trim().toLowerCase()]);
    setNewInviteEmail("");
  };

  const removeInviteEmail = (email: string) => {
    setInvites(invites.filter((e) => e !== email));
  };

  if (!isLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Spinner size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col py-10 px-4 sm:px-6">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md">
          {step === "welcome" && (
            <div className="text-center space-y-8 animate-fade-in">
              <div>
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Users size={40} className="text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-text-primary mb-3">
                  Welcome to Zawly!
                </h1>
                <p className="text-text-secondary text-lg">
                  Get started by creating a new family calendar
                  <br />or joining an existing one.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => setStep("create")}
                  className="w-full p-4 rounded-[--radius-md] border-2 border-primary bg-primary text-white hover:bg-primary-dark transition-all flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Plus size={24} />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-lg">Create a Family</p>
                    <p className="text-sm text-white/80">Start fresh and invite members</p>
                  </div>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => setStep("join")}
                  className="w-full p-4 rounded-[--radius-md] border-2 border-border bg-surface hover:bg-surface-alt hover:border-text-tertiary transition-all flex items-center gap-4 group"
                >
                  <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center">
                    <ArrowRight size={24} className="text-text-secondary" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-text-primary text-lg">Join a Family</p>
                    <p className="text-sm text-text-secondary">Enter an invite code</p>
                  </div>
                  <ArrowRight size={20} className="text-text-tertiary group-hover:translate-x-1 group-hover:text-text-primary transition-all" />
                </button>
              </div>
            </div>
          )}

          {step === "create" && (
            <div className="animate-slide-up">
              <button
                onClick={() => setStep("welcome")}
                className="mb-6 text-text-secondary hover:text-text-primary flex items-center gap-1 text-sm transition-colors"
              >
                ← Back
              </button>

              <h2 className="text-2xl font-bold text-text-primary mb-2">Create Your Family</h2>
              <p className="text-text-secondary mb-6">Give your family calendar a name</p>

              <div className="space-y-4">
                <Input
                  label="Family Name"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="The Smith Family"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateFamily()}
                />

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Country (for holidays)
                  </label>
                  <div className="relative">
                    <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full h-12 pl-10 pr-4 rounded-[--radius-sm] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary appearance-none cursor-pointer"
                    >
                      {COUNTRIES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-text-tertiary mt-1">
                    Shows your country's bank holidays on the calendar
                  </p>
                </div>

                {/* Email Invitations */}
                <div className="pt-4">
                  <p className="text-sm font-medium text-text-primary mb-2">
                    Invite family members (optional)
                  </p>
                  <div className="flex gap-2 mb-3">
                    <div className="flex-1 relative">
                      <Envelope 
                        size={18} 
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" 
                      />
                      <input
                        type="email"
                        value={newInviteEmail}
                        onChange={(e) => setNewInviteEmail(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && addInviteEmail()}
                        placeholder="Enter email address"
                        className="w-full h-10 pl-10 pr-4 rounded-[--radius-sm] border border-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                        disabled={invites.length >= MAX_FAMILY_MEMBERS - 1}
                      />
                    </div>
                    <button
                      onClick={addInviteEmail}
                      disabled={invites.length >= MAX_FAMILY_MEMBERS - 1}
                      className="h-10 px-3 rounded-[--radius-sm] bg-surface-alt hover:bg-border disabled:opacity-50 transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                  </div>

                  {invites.length > 0 && (
                    <div className="space-y-2">
                      {invites.map((email) => (
                        <div 
                          key={email} 
                          className="flex items-center justify-between p-2 rounded-[--radius-sm] bg-surface-alt border border-border"
                        >
                          <span className="text-sm text-text-primary truncate">{email}</span>
                          <button
                            onClick={() => removeInviteEmail(email)}
                            className="p-1 text-text-tertiary hover:text-error-dark transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-text-tertiary mt-2">
                    {invites.length}/{MAX_FAMILY_MEMBERS - 1} invitations
                  </p>
                </div>

                <Button
                  onClick={handleCreateFamily}
                  loading={loading}
                  className="w-full"
                  leftIcon={<Plus size={18} />}
                >
                  Create Family
                </Button>
              </div>
            </div>
          )}

          {step === "join" && (
            <div className="animate-slide-up">
              <button
                onClick={() => setStep("welcome")}
                className="mb-6 text-text-secondary hover:text-text-primary flex items-center gap-1 text-sm transition-colors"
              >
                ← Back
              </button>

              <h2 className="text-2xl font-bold text-text-primary mb-2">Join a Family</h2>
              <p className="text-text-secondary mb-6">Enter the invite code you received</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1.5">
                    Invite Code
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinFamily()}
                    placeholder="ABCDEF"
                    maxLength={6}
                    className="w-full h-14 px-4 rounded-[--radius-sm] border border-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-2xl tracking-[0.2em] text-center uppercase"
                  />
                  <p className="text-xs text-text-tertiary mt-2 text-center">
                    6 characters, letters and numbers only
                  </p>
                </div>

                <Button
                  onClick={handleJoinFamily}
                  loading={loading}
                  className="w-full"
                  leftIcon={<ArrowRight size={18} />}
                >
                  Join Family
                </Button>

                <p className="text-center text-sm text-text-secondary">
                  Don't have a code?{" "}
                  <button
                    onClick={() => setStep("create")}
                    className="text-primary hover:underline font-medium"
                  >
                    Create a family instead
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Success Modal with Created Invitations */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          router.push("/dashboard");
        }}
        title="Family Created!"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-success">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <Check size={24} weight="bold" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">{familyName}</p>
              <p className="text-sm text-text-secondary">has been created</p>
            </div>
          </div>

          {createdInvitations.length > 0 && (
            <div className="bg-surface-alt/50 rounded-[--radius-md] p-4">
              <p className="font-medium text-text-primary mb-2">
                Invitations Sent ({createdInvitations.length})
              </p>
              <div className="space-y-2">
                {createdInvitations.map((inv) => (
                  <div 
                    key={inv.id}
                    className="flex items-center gap-2 text-sm text-text-secondary"
                  >
                    <Envelope size={16} className="text-primary" />
                    <span>{inv.email}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-sm text-text-secondary">
            They've been sent an email with instructions to join. 
            You can also share your invite code if needed.
          </p>

          <Button 
            onClick={() => {
              setShowInviteModal(false);
              router.push("/dashboard");
            }}
            className="w-full"
          >
            Go to Dashboard
          </Button>
        </div>
      </Modal>
    </div>
  );
}
