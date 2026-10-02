import React, { useEffect, useState } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Layers,
  Edit,
  CheckCircle2,
  XCircle,
  Plus,
} from 'lucide-react';
import { usersApi, teamsApi } from '../../api/usersApi.js';
import { Card } from '../../components/common/Card.jsx';
import { Badge } from '../../components/common/Badge.jsx';
import { Button } from '../../components/common/Button.jsx';
import { Modal } from '../../components/common/Modal.jsx';
import { Input } from '../../components/common/Input.jsx';
import { Skeleton } from '../../components/common/Skeleton.jsx';
import { ROLE_LABELS, ROLE_COLORS, ROLES } from '../../constants/roles.js';
import toast from 'react-hot-toast';

export const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userFormData, setUserFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: ROLES.SALES_EXECUTIVE,
    teamId: '',
    phone: '',
    password: '',
  });

  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    managerId: '',
    description: '',
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [usersRes, teamsRes] = await Promise.all([
        usersApi.getUsers(),
        teamsApi.getTeams(),
      ]);

      if (usersRes.success) setUsers(usersRes.data);
      if (teamsRes.success) setTeams(teamsRes.data);
    } catch (err) {
      toast.error(err.message || 'Failed to load user management data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateOrUpdateUser = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await usersApi.updateUser(editingUser._id, userFormData);
        toast.success('User updated successfully');
      } else {
        await usersApi.createUser(userFormData);
        toast.success('User account created successfully');
      }
      setIsUserModalOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to save user');
    }
  };

  const handleCreateTeam = async (e) => {
    e.preventDefault();
    try {
      await teamsApi.createTeam(teamFormData);
      toast.success('Sales team created successfully');
      setIsTeamModalOpen(false);
      setTeamFormData({ name: '', managerId: '', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to create team');
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      await usersApi.updateUser(user._id, { isActive: !user.isActive });
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            User & Team Management
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Administer organization roles, teams, staff credentials, and round-robin capacities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'users' ? (
            <Button
              size="sm"
              variant="primary"
              icon={UserPlus}
              onClick={() => {
                setEditingUser(null);
                setUserFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  role: ROLES.SALES_EXECUTIVE,
                  teamId: '',
                  phone: '',
                  password: 'Password123!',
                });
                setIsUserModalOpen(true);
              }}
            >
              Add Staff User
            </Button>
          ) : (
            <Button
              size="sm"
              variant="primary"
              icon={Plus}
              onClick={() => setIsTeamModalOpen(true)}
            >
              Create Team
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Accounts ({users.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('teams')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'teams'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Sales Teams ({teams.length})</span>
        </button>
      </div>

      {/* Users Tab Content */}
      {activeTab === 'users' && (
        <Card noPadding className="overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" count={5} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-3">Role</th>
                    <th className="py-3 px-3">Sales Team</th>
                    <th className="py-3 px-3">Phone</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50/60 dark:hover:bg-slate-850/40">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 flex items-center justify-center font-bold text-xs">
                            {user.firstName[0]}{user.lastName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-[11px] text-slate-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            ROLE_COLORS[user.role] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        {user.teamId ? (
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {user.teamId.name || 'Team'}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">No Team</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {user.phone || '—'}
                      </td>
                      <td className="py-3 px-3">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-500 text-xs font-medium">
                            <XCircle className="w-3.5 h-3.5" /> Disabled
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user);
                              setUserFormData({
                                firstName: user.firstName,
                                lastName: user.lastName,
                                email: user.email,
                                role: user.role,
                                teamId: user.teamId?._id || user.teamId || '',
                                phone: user.phone || '',
                                password: '',
                              });
                              setIsUserModalOpen(true);
                            }}
                            className="p-1 text-slate-400 hover:text-indigo-600"
                            title="Edit User"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <Button
                            size="xs"
                            variant={user.isActive ? 'secondary' : 'primary'}
                            onClick={() => handleToggleUserStatus(user)}
                          >
                            {user.isActive ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Teams Tab Content */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teams.map((team) => (
            <Card key={team._id} title={team.name} subtitle={team.description || 'Sales Pipeline Team'}>
              <div className="space-y-3 pt-2 text-xs">
                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">Team Manager: </span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {team.managerId ? `${team.managerId.firstName} ${team.managerId.lastName}` : 'Unassigned'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold uppercase text-[10px]">Active Members: </span>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    {team.memberIds && team.memberIds.length > 0 ? (
                      team.memberIds.map((m) => (
                        <span
                          key={m._id}
                          className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium"
                        >
                          {m.firstName} {m.lastName}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">No assigned representatives</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title={editingUser ? 'Edit User Profile' : 'Create Organization User'}
        subtitle="Manage staff credentials, corporate permissions, and team placement."
      >
        <form onSubmit={handleCreateOrUpdateUser} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="First Name"
              required
              value={userFormData.firstName}
              onChange={(e) => setUserFormData({ ...userFormData, firstName: e.target.value })}
            />
            <Input
              label="Last Name"
              required
              value={userFormData.lastName}
              onChange={(e) => setUserFormData({ ...userFormData, lastName: e.target.value })}
            />
          </div>

          <Input
            label="Work Email"
            type="email"
            required
            disabled={!!editingUser}
            value={userFormData.email}
            onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
          />

          {!editingUser && (
            <Input
              label="Initial Password"
              type="password"
              required
              value={userFormData.password}
              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Role Permission
              </label>
              <select
                value={userFormData.role}
                onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value={ROLES.ADMIN}>Administrator</option>
                <option value={ROLES.SALES_MANAGER}>Sales Manager</option>
                <option value={ROLES.SALES_EXECUTIVE}>Sales Executive</option>
                <option value={ROLES.SUPPORT_AGENT}>Support Agent</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Sales Team
              </label>
              <select
                value={userFormData.teamId}
                onChange={(e) => setUserFormData({ ...userFormData, teamId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
              >
                <option value="">No Team Assigned</option>
                {teams.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Phone Number"
            type="tel"
            value={userFormData.phone}
            onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsUserModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {editingUser ? 'Save Updates' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Create Team Modal */}
      <Modal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
        title="Create Sales Team"
        subtitle="Organize representatives under a team manager for targeted lead routing."
      >
        <form onSubmit={handleCreateTeam} className="space-y-4 text-xs">
          <Input
            label="Team Name"
            required
            placeholder="e.g. Enterprise EMEA Team"
            value={teamFormData.name}
            onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
          />

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Team Manager
            </label>
            <select
              value={teamFormData.managerId}
              onChange={(e) => setTeamFormData({ ...teamFormData, managerId: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white"
            >
              <option value="">Select Manager</option>
              {users
                .filter((u) => [ROLES.SALES_MANAGER, ROLES.ADMIN].includes(u.role))
                .map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.firstName} {m.lastName} ({m.role})
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              placeholder="Team scope and regional coverage..."
              value={teamFormData.description}
              onChange={(e) => setTeamFormData({ ...teamFormData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-xs text-slate-900 dark:text-white resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={() => setIsTeamModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Create Team
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
