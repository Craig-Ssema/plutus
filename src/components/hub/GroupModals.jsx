import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Lock, Globe, UserPlus, Check, UserCircle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const ModalShell = ({ open, onClose, title, children }) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-5">{children}</div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/** CreateGroupModal — name, description, privacy; creator becomes owner. */
export const CreateGroupModal = ({ open, onClose, onCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleCreate = async () => {
    if (!name.trim() || !user || busy) return;
    setBusy(true);

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        is_private: isPrivate,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Couldn't create group", description: error.message, variant: "destructive" });
      setBusy(false);
      return;
    }

    const { error: memberError } = await supabase
      .from('group_members')
      .insert({ group_id: group.id, user_id: user.id, role: 'owner' });

    setBusy(false);

    if (memberError) {
      toast({ title: "Couldn't join your group", description: memberError.message, variant: "destructive" });
      return;
    }

    toast({ title: "Group created", description: `${group.name} is ready. Invite some traders!` });
    setName('');
    setDescription('');
    setIsPrivate(false);
    onCreated?.(group);
    onClose();
  };

  return (
    <ModalShell open={open} onClose={onClose} title="Create a group">
      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-gray-500">Group name</label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Options Traders"
            maxLength={50}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500">Description (optional)</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this group about?"
            className="mt-1"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setIsPrivate(false)}
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors",
              !isPrivate
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            <Globe className="w-4 h-4" /> Public
          </button>
          <button
            onClick={() => setIsPrivate(true)}
            className={cn(
              "flex items-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors",
              isPrivate
                ? 'border-blue-600 bg-blue-50 text-blue-700'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            <Lock className="w-4 h-4" /> Private
          </button>
        </div>
        <p className="text-xs text-gray-400">
          {isPrivate
            ? 'Only members and invited users can see this group.'
            : 'Anyone on Plutus can see this group. Joining still requires an invite.'}
        </p>
        <Button
          onClick={handleCreate}
          disabled={!name.trim() || busy}
          className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 font-semibold"
        >
          <Users className="w-4 h-4 mr-1.5" />
          {busy ? 'Creating...' : 'Create Group'}
        </Button>
      </div>
    </ModalShell>
  );
};

/** InviteMembersModal — invite any Plutus user to a group. */
export const InviteMembersModal = ({ open, onClose, group }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [memberIds, setMemberIds] = useState(new Set());
  const [invitedIds, setInvitedIds] = useState(new Set());
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!open || !group || !user) return;

    const load = async () => {
      const [{ data: profiles }, { data: members }, { data: invites }] = await Promise.all([
        supabase.from('profiles').select('id, username, full_name, avatar_url').neq('id', user.id).order('username'),
        supabase.from('group_members').select('user_id').eq('group_id', group.id),
        supabase.from('group_invites').select('invitee_id').eq('group_id', group.id).eq('status', 'pending'),
      ]);

      setUsers(profiles || []);
      setMemberIds(new Set((members || []).map(m => m.user_id)));
      setInvitedIds(new Set((invites || []).map(i => i.invitee_id)));
    };

    load();
  }, [open, group, user]);

  const handleInvite = async (inviteeId) => {
    if (busyId) return;
    setBusyId(inviteeId);

    const { error } = await supabase
      .from('group_invites')
      .insert({ group_id: group.id, inviter_id: user.id, invitee_id: inviteeId });

    setBusyId(null);

    if (error) {
      toast({ title: "Couldn't send invite", description: error.message, variant: "destructive" });
      return;
    }

    setInvitedIds((prev) => new Set([...prev, inviteeId]));
  };

  const filtered = users.filter(u =>
    (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ModalShell open={open} onClose={onClose} title={`Invite to ${group?.name || 'group'}`}>
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search users..."
        className="mb-3"
      />
      <div className="max-h-64 overflow-y-auto space-y-1 -mx-1 px-1">
        {filtered.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">No users found</p>
        )}
        {filtered.map((u) => {
          const isMember = memberIds.has(u.id);
          const isInvited = invitedIds.has(u.id);
          return (
            <div key={u.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{u.username}</p>
                {u.full_name && <p className="text-xs text-gray-400 truncate">{u.full_name}</p>}
              </div>
              {isMember ? (
                <span className="text-xs text-gray-400 font-medium">Member</span>
              ) : isInvited ? (
                <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                  <Check className="w-3.5 h-3.5" /> Invited
                </span>
              ) : (
                <Button
                  size="sm"
                  onClick={() => handleInvite(u.id)}
                  disabled={busyId === u.id}
                  className="rounded-lg bg-blue-600 hover:bg-blue-700 h-8 px-3 text-xs font-semibold"
                >
                  <UserPlus className="w-3.5 h-3.5 mr-1" /> Invite
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </ModalShell>
  );
};
