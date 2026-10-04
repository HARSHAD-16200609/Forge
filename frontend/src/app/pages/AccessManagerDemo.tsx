"use client";

import * as React from "react";
import { AccessManagerCard, type Member } from "@/components/ui/health-stat-card";
import { ShieldCheck } from "lucide-react";

const initialMembers: Member[] = [
  {
    id: "1",
    name: "Walter White",
    email: "heisenberg@methlab.com",
    avatar: undefined,
    role: "Owner",
  },
  {
    id: "2",
    name: "Jesse Pinkman",
    email: "yo@bitch.com",
    avatar: undefined,
    role: "Viewer",
  },
  {
    id: "3",
    name: "Saul Goodman",
    email: "legal@bettercallsaul.com",
    avatar: undefined,
    role: "Editor",
  },
];

export default function AccessManagerDemo() {
  const [members, setMembers] = React.useState<Member[]>(initialMembers);

  const handleRoleChange = (id: string, newRole: "Viewer" | "Editor") => {
    setMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, role: newRole } : m))
    );
    console.log(`${id} changed to ${newRole}`);
  };

  const handleInvite = (email: string, role: "Viewer" | "Editor") => {
    const newMember: Member = {
      id: (members.length + 1).toString(),
      name: email.split("@")[0],
      email,
      avatar: undefined,
      role,
    };
    setMembers((prev) => [...prev, newMember]);
    console.log(`Invited ${email} as ${role}`);
  };

  return (
    <div className="flex h-full min-h-screen items-center justify-center bg-background p-6">
      <AccessManagerCard
        title="Project Access"
        description="Manage team permissions easily."
        folderName="AI Research Docs"
        onlineUserIds={["1", "2"]}
        members={members}
        onInvite={handleInvite}
        onRoleChange={handleRoleChange}
        folderIcon={<ShieldCheck className="h-6 w-6 text-primary" />}
      />
    </div>
  );
}