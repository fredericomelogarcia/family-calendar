"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth, useSignIn, useReverification, useSession } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  SignOut,
  Copy,
  Check,
  Trash,
  PencilSimple,
  Lock,
  Crown,
  UserMinus,
  Warning,
  Envelope,
  X,
  PaperPlaneRight,
  Clock,
  ArrowClockwise,
  User,
  Users,
  Heart,
  Globe,
} from "@phosphor-icons/react";

const COUNTRIES = [
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { showToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { CustomPricingTable } from "@/components/support/pricing-table";
import { ContactFormButton } from "@/components/support/contact-form-button";

const MAX_FAMILY_MEMBERS = 6;

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ChangePasswordValues = z.infer<typeof changePasswordSchema>;

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string | null;
}

interface Invitation {
  id: string;
  email: string;
  status: "pending" | "accepted" | "declined" | "expired";
  createdAt: string;
  expiresAt: string;
  inviterName?: string;
}

interface Family {
  id: string;
  name: string;
  inviteCode: string;
  country: string;
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [country, setCountry] = useState("GB");
  const [countryLoading, setCountryLoading] = useState(false);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("member");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "family" | "support">("profile");

  const tabs = [
    { id: "profile" as const, label: "Profile", icon: User },
    { id: "family" as const, label: "Family", icon: Users },
    { id: "support" as const, label: "Support", icon: Heart },
  ];

  // Modal states
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showEditFamilyNameModal, setShowEditFamilyNameModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showRemoveMemberModal, setShowRemoveMemberModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<FamilyMember | null>(null);
  const [selectedNewAdmin, setSelectedNewAdmin] = useState<string>("");

  // Password modal state
  const [passwordServerError, setPasswordServerError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  // Store the new password values so we can retry after verification
  const [pendingPasswordValues, setPendingPasswordValues] = useState<ChangePasswordValues | null>(null);
  const [reverificationCallbacks, setReverificationCallbacks] = useState<{
    complete: () => void;
    cancel: () => void;
  } | null>(null);

  const { session } = useSession();

  const aReverifyPassword = useReverification(async (values: ChangePasswordValues) => {
    await user?.updatePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    closeChangePasswordModal();
    showToast("success", "Password updated!");
  }, {
    onNeedsReverification: ({ complete, cancel }) => {
      setReverificationCallbacks({ complete, cancel });
      setNeedsVerification(true);
      
      // Prepare the first factor verification if the session is available
      if (session) {
        session.startVerification({ level: 'first_factor' }).then(async (resource) => {
          if (resource.status === 'needs_first_factor') {
            const factor = resource.supportedFirstFactors?.find(f => f.strategy === 'email_code');
            if (factor) {
              await session?.prepareFirstFactorVerification({
                strategy: factor.strategy,
                emailAddressId: factor.emailAddressId,
              });
            }
          }
        }).catch(err => {
          console.error("Failed to start reverification:", err);
          setPasswordServerError("Failed to start verification. Please try again.");
        });
      }
    }
  });

  // Change password form (zod + react-hook-form)
  const {
    register,
    handleSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isValid: passwordFormValid },
  } = useForm<ChangePasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
  });

  // Form states
  const [newFamilyName, setNewFamilyName] = useState("");
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [hasFamily, setHasFamily] = useState<boolean | null>(null);

  // Invitation states
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);

  // Loading states
  const [nameLoading, setNameLoading] = useState(false);
  const [familyNameLoading, setFamilyNameLoading] = useState(false);
  const [leaveLoading, setLeaveLoading] = useState(false);
  const [removeLoading, setRemoveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Delete account confirmation
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    setNewFirstName(user.firstName || "");
    setNewLastName(user.lastName || "");

    fetchFamilyData();
  }, [user, isLoaded]);

  const fetchFamilyData = async () => {
    try {
      const [familyRes, invitesRes] = await Promise.all([
        fetch("/api/family"),
        fetch("/api/family/invite"),
      ]);
      const data = await familyRes.json();
      const invitesData = await invitesRes.json().catch(() => ({ invitations: [] }));

      if (data.hasFamily) {
        setFamily(data.family);
        setMembers(data.members || []);
        setCurrentUserRole(data.currentUserRole);
        setNewFamilyName(data.family?.name || "");
        setCountry(data.family?.country || "US");
        setHasFamily(true);
        setInvitations(invitesData.invitations || []);
      } else {
        setHasFamily(false);
      }
    } catch (error) {
      console.error("Error fetching family:", error);
    } finally {
      setLoading(false);
    }
  };

  const copyInviteCode = async () => {
    if (family?.inviteCode) {
      await navigator.clipboard.writeText(family.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast("success", "Invite code copied!");
    }
  };

  const regenerateInviteCode = async () => {
    try {
      const res = await fetch("/api/family/invite-code", { method: "POST" });
      const data = await res.json();

      if (data.inviteCode) {
        setFamily((prev) => prev ? { ...prev, inviteCode: data.inviteCode } : null);
        showToast("success", "New invite code generated!");
      }
    } catch (error) {
      showToast("error", "Failed to regenerate invite code");
    }
  };

  // Send email invitation
  const sendInvitation = async () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      showToast("error", "Please enter a valid email address");
      return;
    }

    // Check if family is full
    if (members.length + invitations.length >= MAX_FAMILY_MEMBERS) {
      showToast("error", `Family is full (max ${MAX_FAMILY_MEMBERS} members)`);
      return;
    }

    // Check if email already invited
    if (invitations.some((inv) => inv.email.toLowerCase() === inviteEmail.toLowerCase().trim())) {
      showToast("error", "This email has already been invited");
      return;
    }

    // Check if email is already a member
    if (members.some((m) => m.email?.toLowerCase() === inviteEmail.toLowerCase().trim())) {
      showToast("error", "This person is already in your family");
      return;
    }

    setInviteLoading(true);
    try {
      const res = await fetch("/api/family/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });

      if (res.ok) {
        const data = await res.json();
        setInvitations((prev) => [...prev, data.invitation]);
        setInviteEmail("");
        showToast("success", `Invitation sent to ${data.invitation.email}`);
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to send invitation");
      }
    } catch (error) {
      showToast("error", "Failed to send invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  // Cancel an invitation
  const cancelInvitation = async (invitationId: string, email: string) => {
    try {
      const res = await fetch("/api/family/invitations", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });

      if (res.ok) {
        setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
        showToast("success", `Invitation to ${email} cancelled`);
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to cancel invitation");
      }
    } catch (error) {
      showToast("error", "Failed to cancel invitation");
    }
  };

  // Resend an invitation
  const resendInvitation = async (invitationId: string, email: string) => {
    try {
      const res = await fetch("/api/family/invitations/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });

      if (res.ok) {
        const data = await res.json();
        // Update the expiration date in the list
        setInvitations((prev) =>
          prev.map((inv) =>
            inv.id === invitationId
              ? { ...inv, expiresAt: data.invitation.expiresAt }
              : inv
          )
        );
        showToast("success", `Invitation resent to ${email}`);
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to resend invitation");
      }
    } catch (error) {
      showToast("error", "Failed to resend invitation");
    }
  };

  const updateFamilyName = async () => {
    if (!newFamilyName.trim() || newFamilyName.length < 2) {
      showToast("error", "Family name must be at least 2 characters");
      return;
    }

    setFamilyNameLoading(true);
    try {
      const res = await fetch("/api/family", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyName: newFamilyName }),
      });

      if (res.ok) {
        const data = await res.json();
        setFamily(data.family);
        setShowEditFamilyNameModal(false);
        showToast("success", "Family name updated!");
      }
    } catch (error) {
      showToast("error", "Failed to update family name");
    } finally {
      setFamilyNameLoading(false);
    }
  };

  const updateCountry = async (newCountry: string) => {
    if (newCountry === country) return;
    
    setCountryLoading(true);
    try {
      const res = await fetch("/api/family", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country: newCountry }),
      });

      if (res.ok) {
        const data = await res.json();
        setFamily(data.family);
        setCountry(newCountry);
        showToast("success", "Country updated!");
      }
    } catch (error) {
      showToast("error", "Failed to update country");
    } finally {
      setCountryLoading(false);
    }
  };

  const updateUserName = async () => {
    if (!newFirstName.trim()) {
      showToast("error", "First name is required");
      return;
    }

    setNameLoading(true);
    try {
      const res = await fetch("/api/user", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: newFirstName.trim(),
          lastName: newLastName.trim(),
        }),
      });

      if (res.ok) {
        await user?.reload();
        setShowEditNameModal(false);
        showToast("success", "Name updated!");
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to update name");
      }
    } catch (error) {
      showToast("error", "Failed to update name");
    } finally {
      setNameLoading(false);
    }
  };

  const openChangePasswordModal = () => {
    resetPasswordForm();
    setPasswordServerError(null);
    setNeedsVerification(false);
    setVerificationCode("");
    setPendingPasswordValues(null);
    setShowChangePasswordModal(true);
  };

  const closeChangePasswordModal = () => {
    setShowChangePasswordModal(false);
    setNeedsVerification(false);
    setVerificationCode("");
    setPasswordServerError(null);
    setPendingPasswordValues(null);
  };

  const onChangePasswordSubmit = async (values: ChangePasswordValues) => {
    setPasswordLoading(true);
    setPasswordServerError(null);

    try {
      await user?.updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      closeChangePasswordModal();
      showToast("success", "Password updated!");
    } catch (error: any) {
      const clerkError = error?.errors?.[0];
      const errorCode = clerkError?.code || error?.code;
      const message = clerkError?.longMessage || clerkError?.message || error?.message || "Failed to update password";

      if (errorCode === "additional_verification_required" || message.toLowerCase().includes("additional verification")) {
        try {
          await aReverifyPassword(values);
        } catch (reverifyError: any) {
          const revMessage = reverifyError?.errors?.[0]?.longMessage || reverifyError?.message || "Reverification failed.";
          setPasswordServerError(revMessage);
        }
        return;
      }

      setPasswordServerError(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode.trim()) {
      showToast("error", "Please enter the verification code");
      return;
    }

    setPasswordLoading(true);
    setPasswordServerError(null);

    try {
      if (!session) throw new Error("Session not available");

      // Verify the email code using the current session's reverification flow
      await session.attemptFirstFactorVerification({
        strategy: 'email_code',
        code: verificationCode.trim(),
      });

      // Notify Clerk that reverification is complete so it retries the original action
      if (reverificationCallbacks) {
        reverificationCallbacks.complete();
      } else {
        throw new Error("Reverification callbacks not found.");
      }

      // Note: The original action (updatePassword) will be automatically retried by useReverification
      // and success/failure will be handled in the aReverifyPassword wrapper.
      
      // We close the modal here as the retry will either succeed (handled by aReverifyPassword)
      // or fail (handled by the catch block in onChangePasswordSubmit).
      closeChangePasswordModal();
    } catch (error: any) {
      const message = error?.errors?.[0]?.longMessage || error?.message || "Invalid verification code.";
      setPasswordServerError(message);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      if (!session) throw new Error("Session not available");

      // For reverification, we must provide the emailAddressId
      // Since we are already in the verification flow, we find the supported factor
      const resource = await session.startVerification({ level: 'first_factor' });
      const factor = resource.supportedFirstFactors?.find(f => f.strategy === 'email_code');
      
      if (!factor) throw new Error("Email verification not supported");

      await session.prepareFirstFactorVerification({
        strategy: factor.strategy,
        emailAddressId: factor.emailAddressId,
      });

      showToast("success", "A new code has been sent to your email.");
    } catch (error: any) {
      showToast("error", error?.message || "Failed to resend code.");
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    setRemoveLoading(true);
    try {
      const res = await fetch("/api/family/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: memberToRemove.id }),
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberToRemove.id));
        setShowRemoveMemberModal(false);
        setMemberToRemove(null);
        showToast("success", `${memberToRemove.name} has been removed from the family`);
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to remove member");
      }
    } catch (error) {
      showToast("error", "Failed to remove member");
    } finally {
      setRemoveLoading(false);
    }
  };

  const leaveFamily = async () => {
    setLeaveLoading(true);
    try {
      const res = await fetch("/api/family/leave", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          currentUserRole === "admin" && selectedNewAdmin
            ? { newAdminId: selectedNewAdmin }
            : {}
        ),
      });

      if (res.ok) {
        showToast("success", "You have left the family");
        // Redirect to onboarding to create/join a new family
        router.push("/onboarding");
      } else {
        const data = await res.json();
        showToast("error", data.error || "Failed to leave family");
      }
    } catch (error) {
      showToast("error", "Failed to leave family");
    } finally {
      setLeaveLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut().then(() => router.push("/"));
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") {
      showToast("error", "Please type DELETE to confirm");
      return;
    }

    setDeleteLoading(true);
    try {
      // 1. Clean up local DB data (family membership, orphaned families/events)
      const cleanupRes = await fetch("/api/user/delete", { method: "DELETE" });
      if (!cleanupRes.ok) {
        const data = await cleanupRes.json();
        showToast("error", data.error || "Failed to clean up account data");
        setDeleteLoading(false);
        return;
      }

      // 2. Delete the Clerk user
      await user?.delete();

      // 3. Sign out and redirect
      showToast("success", "Your account has been deleted");
      await signOut();
      router.push("/");
    } catch (error: any) {
      const message = error?.errors?.[0]?.longMessage || error?.message || "Failed to delete account";
      showToast("error", message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const otherMembers = members.filter((m) => m.id !== user?.id);

  if (!isLoaded || loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (hasFamily === false) {
    // Redirect to onboarding if no family
    router.push("/onboarding");
    return null;
  }

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary mb-6 hidden lg:block">
        Settings
      </h1>

      {/* Tab Navigation - Desktop */}
      <div className="hidden lg:flex items-center gap-1 mb-6 p-1 bg-surface-alt rounded-[--radius-lg]">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-[--radius-md] text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-surface shadow-sm text-text-primary"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Navigation - Mobile */}
      <div className="lg:hidden mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  activeTab === tab.id
                    ? "bg-surface text-text-primary border border-border shadow-sm"
                    : "text-text-secondary bg-surface-alt"
                )}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {/* PROFILE TAB */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <section>
              <div className="bg-surface rounded-[--radius-md] border border-border overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar name={user?.fullName || "User"} src={user?.imageUrl} size="lg" />
                    <div>
                      <h3 className="font-semibold text-text-primary">{user?.fullName || "User"}</h3>
                      <p className="text-sm text-text-secondary">{user?.emailAddresses?.[0]?.emailAddress || "No email"}</p>
                    </div>
                  </div>
                  <button onClick={() => { setNewFirstName(user?.firstName || ""); setNewLastName(user?.lastName || ""); setShowEditNameModal(true); }} className="p-2 text-text-secondary hover:text-text-primary transition-colors" aria-label="Edit your name">
                    <PencilSimple size={20} />
                  </button>
                </div>
                <div className="p-4 border-b border-border">
                  <p className="text-sm text-text-secondary">Email</p>
                  <p className="font-medium text-text-primary">{user?.emailAddresses?.[0]?.emailAddress || "No email"}</p>
                </div>
                <button onClick={openChangePasswordModal} className="w-full p-4 flex items-center justify-between hover:bg-surface-alt/50 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Lock size={20} className="text-text-secondary" />
                    <span className="font-medium text-text-primary">Change Password</span>
                  </div>
                </button>
              </div>
            </section>

            <section>
              <Button variant="ghost" onClick={handleSignOut} leftIcon={<SignOut size={18} />} className="w-full justify-start text-text-secondary hover:text-text-primary">
                Sign Out
              </Button>
            </section>

            <section className="pt-4 border-t border-border">
              <h2 className="text-sm font-semibold text-error-dark uppercase tracking-wide mb-3">Danger Zone</h2>
              <div className="bg-surface rounded-[--radius-md] border border-border overflow-hidden">
                <button onClick={() => { setDeleteConfirmText(""); setShowDeleteAccountModal(true); }} className="w-full p-4 flex items-center justify-between hover:bg-error/5 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <Warning size={20} className="text-error-dark" />
                    <div>
                      <span className="font-medium text-error-dark">Delete Account</span>
                      <p className="text-xs text-text-tertiary">Permanently delete your account and all data</p>
                    </div>
                  </div>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* FAMILY TAB */}
        {activeTab === "family" && (
          <div className="space-y-6">
            <section>
              <div className="bg-surface rounded-[--radius-md] border border-border overflow-hidden">
                <div className="p-4 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-text-primary">{family?.name}</h3>
                    <p className="text-sm text-text-secondary">Family name</p>
                  </div>
                  {currentUserRole === "admin" && (
                    <button onClick={() => setShowEditFamilyNameModal(true)} className="p-2 text-text-secondary hover:text-text-primary transition-colors" aria-label="Edit family name">
                      <PencilSimple size={20} />
                    </button>
                  )}
                </div>

                {/* Country */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3 mb-2">
                    <Globe size={18} className="text-text-tertiary" />
                    <p className="text-sm text-text-secondary">Country</p>
                  </div>
                  <select
                    value={country}
                    onChange={(e) => updateCountry(e.target.value)}
                    disabled={countryLoading || currentUserRole !== "admin"}
                    className="w-full h-10 px-3 rounded-[--radius-sm] border border-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Invite Code */}
                {currentUserRole === "admin" && members.length < MAX_FAMILY_MEMBERS && (
                  <div className="p-4 border-b border-border">
                    <p className="text-sm text-text-secondary mb-2">Invite Code</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 px-4 py-3 bg-surface-alt rounded-[--radius-sm] font-mono text-lg tracking-wider text-text-primary">{family?.inviteCode}</div>
                      <button onClick={copyInviteCode} className="p-3 rounded-[--radius-sm] bg-surface-alt hover:bg-border transition-colors" aria-label="Copy invite code">
                        {copied ? <Check size={20} className="text-success" /> : <Copy size={20} className="text-text-secondary" />}
                      </button>
                      <button onClick={regenerateInviteCode} className="p-3 rounded-[--radius-sm] bg-surface-alt hover:bg-border transition-colors" aria-label="Generate new invite code">
                        <Trash size={20} className="text-text-secondary" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Invite by Email */}
                {currentUserRole === "admin" && members.length + invitations.length < MAX_FAMILY_MEMBERS && (
                  <div className="p-4 border-b border-border">
                    <p className="text-sm text-text-secondary mb-2">Invite by Email</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <Envelope size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
                        <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendInvitation()} placeholder="family member's email" className="w-full h-11 pl-10 pr-4 rounded-[--radius-sm] border border-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary text-sm" disabled={inviteLoading} />
                      </div>
                      <button onClick={sendInvitation} disabled={inviteLoading || !inviteEmail.trim()} className="h-11 px-4 rounded-[--radius-sm] bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center gap-2">
                        {inviteLoading ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <PaperPlaneRight size={18} />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Pending Invitations */}
                {currentUserRole === "admin" && invitations.length > 0 && (
                  <div className="p-4 border-b border-border">
                    <p className="text-sm text-text-secondary mb-3">Pending Invitations ({invitations.length})</p>
                    <div className="space-y-2">
                      {invitations.map((invitation) => (
                        <div key={invitation.id} className="flex items-center gap-3 p-3 rounded-[--radius-sm] bg-surface-alt/50 border border-border">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><Envelope size={16} className="text-primary" /></div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-text-primary text-sm truncate">{invitation.email}</p>
                            <div className="flex items-center gap-2 text-xs text-text-tertiary">
                              <Clock size={12} /><span>Sent {new Date(invitation.createdAt).toLocaleDateString()}</span><span className="text-warning">• Pending</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <button onClick={() => resendInvitation(invitation.id, invitation.email)} className="p-2 text-text-tertiary hover:text-primary transition-colors" aria-label="Resend invitation"><ArrowClockwise size={18} /></button>
                            <button onClick={() => cancelInvitation(invitation.id, invitation.email)} className="p-2 text-text-tertiary hover:text-error-dark transition-colors" aria-label="Cancel invitation"><X size={18} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Members */}
                <div className="p-4 border-b border-border">
                  <p className="text-sm text-text-secondary mb-3">Members ({members.length}/{MAX_FAMILY_MEMBERS})</p>
                  <div className="space-y-3">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center gap-3">
                        <Avatar name={member.name} src={member.avatar} size="md" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-text-primary">{member.name}</p>
                            {member.role === "admin" && <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-primary-dark bg-primary/15 px-1.5 py-0.5 rounded-[--radius-sm]"><Crown size={10} weight="fill" />Admin</span>}
                            {member.id === user?.id && <span className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary bg-surface-alt px-1.5 py-0.5 rounded-[--radius-sm]">You</span>}
                          </div>
                          <p className="text-xs text-text-tertiary">{member.email}</p>
                        </div>
                        {currentUserRole === "admin" && member.id !== user?.id && (
                          <button onClick={() => { setMemberToRemove(member); setShowRemoveMemberModal(true); }} className="p-2 text-text-tertiary hover:text-error-dark transition-colors" aria-label="Remove member"><UserMinus size={18} /></button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Leave Family */}
                <div className="p-4">
                  <Button variant="ghost" onClick={() => { setSelectedNewAdmin(""); setShowLeaveModal(true); }} className="w-full justify-start text-error-dark hover:text-error-dark hover:bg-error/10" leftIcon={<SignOut size={18} />}>Leave Family</Button>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <section>
              <div className="bg-surface rounded-[--radius-md] border border-border p-6 md:p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h3 className="text-xl font-bold text-text-primary font-[family-name:var(--font-heading)]">Support Zawly Calendar</h3>
                  <p className="text-text-secondary">Zawly Calendar is and will always be free for everyone. If you find it helpful and want to support the continuous development, you can do so below.</p>
                </div>
                <div className="flex justify-center"><CustomPricingTable /></div>
                <p className="text-xs text-text-tertiary text-center">The support plan is completely optional and does not unlock extra features, but it is greatly appreciated!</p>
                <ContactFormButton />
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Edit Name Modal */}
      <Modal
        isOpen={showEditNameModal}
        onClose={() => setShowEditNameModal(false)}
        title="Edit Your Name"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="First Name"
            value={newFirstName}
            onChange={(e) => setNewFirstName(e.target.value)}
            placeholder="First name"
          />
          <Input
            label="Last Name"
            value={newLastName}
            onChange={(e) => setNewLastName(e.target.value)}
            placeholder="Last name"
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowEditNameModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={updateUserName}
              loading={nameLoading}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Family Name Modal */}
      <Modal
        isOpen={showEditFamilyNameModal}
        onClose={() => setShowEditFamilyNameModal(false)}
        title="Edit Family Name"
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Family Name"
            value={newFamilyName}
            onChange={(e) => setNewFamilyName(e.target.value)}
            placeholder="The Smiths"
          />
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowEditFamilyNameModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={updateFamilyName}
              loading={familyNameLoading}
              className="flex-1"
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        isOpen={showChangePasswordModal}
        onClose={closeChangePasswordModal}
        title={needsVerification ? "Verify Your Email" : "Change Password"}
        size="sm"
      >
        <div className="space-y-4">
          {!needsVerification ? (
            <form
              onSubmit={handleSubmit(onChangePasswordSubmit)}
              className="space-y-4"
            >
              <Input
                label="Current Password"
                type="password"
                placeholder="Enter current password"
                {...register("currentPassword")}
                error={passwordErrors.currentPassword?.message}
              />
              <Input
                label="New Password"
                type="password"
                placeholder="Enter new password"
                {...register("newPassword")}
                error={passwordErrors.newPassword?.message}
              />
              <Input
                label="Confirm New Password"
                type="password"
                placeholder="Confirm new password"
                {...register("confirmPassword")}
                error={passwordErrors.confirmPassword?.message}
              />

              {passwordServerError && (
                <div className="p-3 text-sm text-error-dark bg-error/10 border border-error/20 rounded-[--radius-sm] animate-slide-up">
                  {passwordServerError}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={closeChangePasswordModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={passwordLoading}
                  disabled={!passwordFormValid}
                  className="flex-1"
                >
                  Update Password
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                For security, we need to verify it's you. A code has been sent to{" "}
                <strong className="text-text-primary">{user?.emailAddresses?.[0]?.emailAddress}</strong>.
              </p>
              <Input
                label="Verification Code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter the code from your email"
              />

              {passwordServerError && (
                <div className="p-3 text-sm text-error-dark bg-error/10 border border-error/20 rounded-[--radius-sm] animate-slide-up">
                  {passwordServerError}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={closeChangePasswordModal}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleVerifyCode}
                  loading={passwordLoading}
                  disabled={!verificationCode.trim()}
                  className="flex-1"
                >
                  Verify & Update
                </Button>
              </div>

              <button
                onClick={handleResendCode}
                className="w-full text-sm text-center text-primary hover:underline"
              >
                Resend code
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Remove Member Modal */}
      <Modal
        isOpen={showRemoveMemberModal}
        onClose={() => {
          setShowRemoveMemberModal(false);
          setMemberToRemove(null);
        }}
        title="Remove Member"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to remove <strong className="text-text-primary">{memberToRemove?.name}</strong> from the family? They will need a new invite code to rejoin.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowRemoveMemberModal(false);
                setMemberToRemove(null);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleRemoveMember}
              loading={removeLoading}
              className="flex-1"
            >
              Remove
            </Button>
          </div>
        </div>
      </Modal>

      {/* Leave Family Modal */}
      <Modal
        isOpen={showLeaveModal}
        onClose={() => setShowLeaveModal(false)}
        title="Leave Family?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-text-secondary">
            Are you sure you want to leave <strong className="text-text-primary">{family?.name}</strong>?{' '}
            {currentUserRole === "admin" && otherMembers.length === 0
              ? <>Since you're the only member, the family will be permanently deleted.</>
              : <>You'll need a new invite code to rejoin.</>
            }
          </p>

          {/* If admin, require selecting a new admin */}
          {currentUserRole === "admin" && otherMembers.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-text-primary font-medium">
                As the admin, you must choose who will manage the family:
              </p>
              <div className="space-y-2">
                {otherMembers.map((member) => (
                  <button
                    key={member.id}
                    onClick={() => setSelectedNewAdmin(member.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-[--radius-sm] border-2 transition-all",
                      selectedNewAdmin === member.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-text-tertiary"
                    )}
                  >
                    <Avatar name={member.name} src={member.avatar} size="sm" />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-text-primary text-sm">{member.name}</p>
                      <p className="text-xs text-text-tertiary">{member.email}</p>
                    </div>
                    {selectedNewAdmin === member.id && (
                      <Check size={20} className="text-primary" weight="bold" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowLeaveModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={leaveFamily}
              loading={leaveLoading}
              disabled={currentUserRole === "admin" && otherMembers.length > 0 && !selectedNewAdmin}
              className="flex-1"
            >
              Leave
            </Button>
          </div>
          {currentUserRole === "admin" && otherMembers.length > 0 && !selectedNewAdmin && (
            <p className="text-xs text-error-dark text-center">
              Select a new admin to continue
            </p>
          )}
        </div>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        isOpen={showDeleteAccountModal}
        onClose={() => {
          setShowDeleteAccountModal(false);
          setDeleteConfirmText("");
        }}
        title="Delete Account?"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 bg-error/10 border border-error/20 rounded-[--radius-sm]">
            <p className="text-sm text-error-dark font-medium">
              This action cannot be undone. All your data will be permanently deleted.
            </p>
            {currentUserRole === "admin" && otherMembers.length > 0 && (
              <p className="text-xs text-error-dark mt-1">
                Admin rights will be transferred to {otherMembers[0]?.name}.
              </p>
            )}
            {currentUserRole === "admin" && otherMembers.length === 0 && (
              <p className="text-xs text-error-dark mt-1">
                Your family will also be permanently deleted.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1.5">
              Type <span className="font-mono font-bold text-error-dark">DELETE</span> to confirm
            </label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full h-12 px-4 rounded-[--radius-sm] border border-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-error focus:border-error font-mono text-center text-lg tracking-wider"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowDeleteAccountModal(false);
                setDeleteConfirmText("");
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              loading={deleteLoading}
              disabled={deleteConfirmText !== "DELETE"}
              className="flex-1"
            >
              Delete Account
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}