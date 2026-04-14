"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  User,
  SignOut,
  Copy,
  Check,
  Trash,
  PencilSimple,
  Sun,
  Moon,
  Desktop,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/ui/avatar";
import { Modal } from "@/components/ui/modal";
import { showToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useTheme, type ThemePreference } from "@/lib/theme";

interface FamilyMember {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

interface Family {
  id: string;
  name: string;
  inviteCode: string;
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>("member");
  const { preference, setPreference, resolvedTheme } = useTheme();
  const [copied, setCopied] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState("");
  const [hasFamily, setHasFamily] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded) return;

    if (!user) {
      router.push("/sign-in");
      return;
    }

    fetchFamilyData();
  }, [user, isLoaded]);

  const fetchFamilyData = async () => {
    try {
      const res = await fetch("/api/family");
      const data = await res.json();

      if (data.hasFamily) {
        setFamily(data.family);
        setMembers(data.members || []);
        setCurrentUserRole(data.currentUserRole);
        setNewFamilyName(data.family?.name || "");
        setHasFamily(true);
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
      const res = await fetch("/api/family/invite", { method: "POST" });
      const data = await res.json();

      if (data.inviteCode) {
        setFamily((prev) => prev ? { ...prev, inviteCode: data.inviteCode } : null);
        showToast("success", "New invite code generated!");
      }
    } catch (error) {
      showToast("error", "Failed to regenerate invite code");
    }
  };

  const updateFamilyName = async () => {
    if (!newFamilyName.trim() || newFamilyName.length < 2) {
      showToast("error", "Family name must be at least 2 characters");
      return;
    }

    try {
      const res = await fetch("/api/family", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ familyName: newFamilyName }),
      });

      if (res.ok) {
        const data = await res.json();
        setFamily(data.family);
        setShowEditNameModal(false);
        showToast("success", "Family name updated!");
      }
    } catch (error) {
      showToast("error", "Failed to update family name");
    }
  };

  const leaveFamily = async () => {
    try {
      const res = await fetch("/api/family/leave", { method: "DELETE" });

      if (res.ok) {
        showToast("success", "You have left the family");
        signOut().then(() => router.push("/"));
      }
    } catch (error) {
      showToast("error", "Failed to leave family");
    }
  };

  const handleSignOut = () => {
    signOut().then(() => router.push("/"));
  };

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
    return (
      <div className="min-h-full flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-xl font-bold text-text-primary mb-2">
            No Family Found
          </h2>
          <p className="text-text-secondary mb-4">
            Please set up your family first.
          </p>
          <Button onClick={() => router.push("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full p-4 md:p-6 lg:p-8 max-w-2xl">
      <h1 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-text-primary mb-6">
        Settings
      </h1>

      {/* Profile Section */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
          Profile
        </h2>
        <div className="bg-surface rounded-[--radius-md] border border-border p-4 flex items-center gap-4">
          <Avatar name={user?.fullName || "User"} src={user?.imageUrl} size="lg" />
          <div className="flex-1">
            <h3 className="font-semibold text-text-primary">
              {user?.fullName || "User"}
            </h3>
            <p className="text-sm text-text-secondary">
              {user?.emailAddresses?.[0]?.emailAddress || "No email"}
            </p>
          </div>
        </div>
      </section>

      {/* Family Section */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
          Family
        </h2>
        <div className="bg-surface rounded-[--radius-md] border border-border overflow-hidden">
          {/* Family Name */}
          <div className="p-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="font-medium text-text-primary">{family?.name}</h3>
              <p className="text-sm text-text-secondary">Family name</p>
            </div>
            {currentUserRole === "admin" && (
              <button
                onClick={() => setShowEditNameModal(true)}
                className="p-2 text-text-secondary hover:text-text-primary transition-colors"
              >
                <PencilSimple size={20} />
              </button>
            )}
          </div>

          {/* Invite Code */}
          {currentUserRole === "admin" && members.length < 3 && (
            <div className="p-4 border-b border-border">
              <p className="text-sm text-text-secondary mb-2">Invite Code</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-surface-alt rounded-[--radius-sm] font-mono text-lg tracking-wider text-text-primary">
                  {family?.inviteCode}
                </div>
                <button
                  onClick={copyInviteCode}
                  className="p-3 rounded-[--radius-sm] bg-surface-alt hover:bg-border transition-colors"
                >
                  {copied ? (
                    <Check size={20} className="text-success" />
                  ) : (
                    <Copy size={20} className="text-text-secondary" />
                  )}
                </button>
                <button
                  onClick={regenerateInviteCode}
                  className="p-3 rounded-[--radius-sm] bg-surface-alt hover:bg-border transition-colors"
                  title="Generate new code"
                >
                  <Trash size={20} className="text-text-secondary" />
                </button>
              </div>
              <p className="text-xs text-text-tertiary mt-2">
                Share this code with family members to invite them
              </p>
            </div>
          )}

          {/* Members */}
          <div className="p-4">
            <p className="text-sm text-text-secondary mb-3">Members ({members.length}/3)</p>
            <div className="space-y-3">
              {members.map((member) => (
                <div key={member.id} className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.avatar} size="md" />
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{member.name}</p>
                    <p className="text-xs text-text-tertiary">{member.email}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Appearance Section */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wide mb-3">
          Appearance
        </h2>
        <div className="bg-surface rounded-[--radius-md] border border-border overflow-hidden">
          <div className="grid grid-cols-3 gap-2 p-3">
            {([
              { value: "auto" as ThemePreference, label: "Auto", icon: Desktop, desc: "System" },
              { value: "light" as ThemePreference, label: "Light", icon: Sun, desc: "Light" },
              { value: "dark" as ThemePreference, label: "Dark", icon: Moon, desc: "Dark" },
            ] as const).map((option) => {
              const Icon = option.icon;
              const isActive = preference === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => setPreference(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-3 rounded-[--radius-md] transition-all duration-150 border-2",
                    isActive
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-text-tertiary text-text-secondary hover:text-text-primary"
                  )}
                >
                  <Icon size={22} weight={isActive ? "fill" : "regular"} />
                  <span className="text-sm font-medium">{option.label}</span>
                  {option.value === "auto" && (
                    <span className={cn(
                      "text-[10px] uppercase tracking-wider",
                      isActive ? "text-primary" : "text-text-tertiary"
                    )}>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Actions */}
      <section>
        <Button
          variant="ghost"
          onClick={handleSignOut}
          leftIcon={<SignOut size={18} />}
          className="w-full justify-start text-error hover:text-error hover:bg-error/10"
        >
          Sign Out
        </Button>
      </section>

      {/* Leave Family Button */}
      <section className="mt-8 pt-8 border-t border-border">
        <Button
          variant="ghost"
          onClick={() => setShowLeaveModal(true)}
          className="w-full text-error hover:bg-error/10"
        >
          Leave Family
        </Button>
      </section>

      {/* Edit Family Name Modal */}
      <Modal
        isOpen={showEditNameModal}
        onClose={() => setShowEditNameModal(false)}
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
              onClick={() => setShowEditNameModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={updateFamilyName}
              className="flex-1"
            >
              Save
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
            Are you sure you want to leave this family? You'll need a new invite code to rejoin.
          </p>
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
              className="flex-1"
            >
              Leave
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}