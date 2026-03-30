'use client';

import { useEffect, useState } from 'react';

import AppShell from '@/components/layout/app-shell';
import PageHeader from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSuperAdminProfile, updateSuperAdminProfile } from '@/lib/api/client';

export default function SecuritySettingsPage() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const profile = await getSuperAdminProfile();
        if (!isMounted) return;

        setName(profile.name);
        setUsername(profile.username);
        setEmail(profile.email);
      } catch {
        if (isMounted) {
          setError('Unable to load super admin profile. Ensure you are logged in as super admin.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      await updateSuperAdminProfile({
        name,
        username,
        email,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });

      setMessage('Super admin credentials updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      setError('Unable to update details. Confirm current password if changing password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell userRole="super_admin">
      <div className="space-y-6">
        <PageHeader
          title="Security Settings"
          description="Update Super Admin login identity and password."
          breadcrumbs={[
            { label: 'Settings', href: '/settings' },
            { label: 'Security' },
          ]}
        />

        <Card>
          <CardHeader>
            <CardTitle>Super Admin Account</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  placeholder="Required if setting a new password"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  placeholder="Leave blank to keep current password"
                  disabled={loading}
                />
              </div>
            </div>

            {message && <p className="text-sm text-green-700">{message}</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex justify-end">
              <Button onClick={() => void handleSave()} disabled={loading || saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
