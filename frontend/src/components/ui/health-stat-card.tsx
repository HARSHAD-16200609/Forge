"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";
import { AvatarDot } from "../SideBar";

export interface Member {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  role: "Owner" | "Editor" | "Viewer";
}

export interface AccessManagerCardProps {
  title?: string;
  description?: string;
  folderIcon?: React.ReactNode;
  folderName: string;
  members: Member[];
  onlineUserIds?: string[];
  onInvite: (email: string, role: "Viewer" | "Editor") => void;
  onRoleChange: (id: string, newRole: "Viewer" | "Editor") => void;
  invitePlaceholder?: string;
  showInviteSection?: boolean;
  showHeaderIcon?: boolean;
  className?: string;
}

export const AccessManagerCard = ({
  folderName,
  members,
  onlineUserIds = [],
  onInvite,
  onRoleChange,
  invitePlaceholder = "Add an email to invite",
  showInviteSection = true,
  className,

}: AccessManagerCardProps) => {
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<"Viewer" | "Editor">("Viewer");
 

  const handleInvite = () => {
    if (!email) return;
    onInvite(email, role);
    setEmail("");
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl border bg-card p-6 shadow-sm text-card-foreground space-y-6",
          className
        )}
      >





        {/* Folder Info */}
        <div className="flex items-center gap-20">

          <div className="flex items-center gap-1">
            <img
              src="https://www.thiings.co/_next/image?url=https%3A%2F%2Flftz25oez4aqbxpq.public.blob.vercel-storage.com%2Fimage-MiDb47ywhTDoylCD2HHmWzangEHtY8.png&w=320&q=75"
              alt="Folder Thumbnail"
              className="h-12 w-12 rounded-lg object-cover"
            />

            <p className="font-medium">{folderName}</p>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="h-4 w-4" />
            <span className="text-xs w-30">{onlineUserIds.length} members online</span>
          </div>

        </div>


        {/* Invite Section */}
        {showInviteSection && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Invite People</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                type="email"
                placeholder={invitePlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-grow"
              />
              <Select
                value={role}
                onValueChange={(val) => setRole(val as "Viewer" | "Editor")}
              >
                <SelectTrigger className="sm:w-[120px] whitespace-nowrap truncate">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Viewer">Can view</SelectItem>
                  <SelectItem value="Editor">Can edit</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite}>Invite</Button>
            </div>
          </div>
        )}

        {/* Members List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Members</h3>
          <motion.ul
            className="space-y-3"
            variants={listVariants}
            initial="hidden"
            animate="visible"
          >
            <AnimatePresence>
              {members.map((user) => (
                <motion.li
                  key={user.id}
                  variants={itemVariants}
                  layout
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <AvatarDot
                      avatar={user.avatar}
                      online={onlineUserIds.includes(user.id)}
                      name={user.name}
                      type={ "gdm"}>

                    </AvatarDot>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      {user.email && (
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      )}
                    </div>
                  </div>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      {user.role === "Owner" ? (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          Owner
                        </span>
                      ) : (
                        <Select
                          value={user.role}
                          onValueChange={(val: "Viewer" | "Editor") =>
                            onRoleChange(user.id, val)
                          }
                        >
                          <SelectTrigger className="w-[120px] text-xs whitespace-nowrap truncate">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem
                              value="Viewer"
                              className="whitespace-nowrap"
                            >
                              Can view
                            </SelectItem>
                            <SelectItem
                              value="Editor"
                              className="whitespace-nowrap"
                            >
                              Can edit
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    </TooltipTrigger>
                    <TooltipContent>
                      Change or view this user’s access level
                    </TooltipContent>
                  </Tooltip>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </div>
      </div>
    </TooltipProvider>
  );
};