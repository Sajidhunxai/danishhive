import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApi } from '@/contexts/ApiContext';
import { Search, CheckCircle, XCircle, Phone, CreditCard, Shield } from 'lucide-react';

interface User {
  user_id: string;
  full_name: string;
  role: string;
  phone: string;
  phone_verified: boolean;
  mitid_verified: boolean;
  payment_verified: boolean;
  created_at: string;
}

export const AdminManualVerification: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [verifyingUser, setVerifyingUser] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const { toast } = useToast();
  const { t } = useLanguage();
  const api = useApi();

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      setFilteredUsers(
        users.filter(user => 
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.phone && user.phone.includes(searchTerm))
        )
      );
    } else {
      setFilteredUsers(users);
    }
  }, [searchTerm, users]);

  const fetchUsers = async () => {
    try {
      const usersData = await api.admin.getUsersWithEmail();

      // Map backend data to expected format
      const usersWithVerification = usersData.map((user: any) => ({
        user_id: user.id,
        full_name: user.fullName,
        role: user.userType,
        phone: user.phoneNumber,
        phone_verified: user.phoneVerified || false,
        mitid_verified: user.profile?.mitidVerified || false,
        payment_verified: user.profile?.paymentVerified || false,
        created_at: user.createdAt,
      }));

      setUsers(usersWithVerification);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Fejl',
        description: error.message || 'Kunne ikke hente brugere',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (userId: string, verificationType: 'phone' | 'mitid' | 'payment', verified: boolean) => {
    setVerifyingUser(userId);
    
    try {
      await api.admin.updateVerification(userId, verificationType, verified);

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.user_id === userId 
            ? { ...user, [`${verificationType}_verified`]: verified }
            : user
        )
      );

      toast({
        title: 'Verificering opdateret',
        description: `${verificationType.charAt(0).toUpperCase() + verificationType.slice(1)} verificering ${verified ? 'godkendt' : 'fjernet'}`,
      });

    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: 'Fejl',
        description: error.message || 'Kunne ikke opdatere verificering',
        variant: 'destructive',
      });
    } finally {
      setVerifyingUser(null);
    }
  };

  const getVerificationStatus = (user: User) => {
    const verifications = [
      { type: 'phone', verified: user.phone_verified, label: 'Telefon' },
      { type: 'mitid', verified: user.mitid_verified, label: 'MitID' },
      { type: 'payment', verified: user.payment_verified, label: 'Betaling' },
    ];

    const verified = verifications.filter(v => v.verified).length;
    const total = verifications.length;

    return { verified, total, verifications };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Manuel Verificering</CardTitle>
          <CardDescription>{t('loading.users')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Manuel Verificering
        </CardTitle>
        <CardDescription>
          Administrer brugerverificering manuelt
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Søg efter navn, ID eller telefonnummer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Users List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => {
            const status = getVerificationStatus(user);
            
            return (
              <Card key={user.user_id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{user.full_name}</h4>
                      <Badge variant="outline">{user.role}</Badge>
                      <Badge variant={status.verified === status.total ? 'default' : 'secondary'}>
                        {status.verified}/{status.total} Verificeret
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      ID: {user.user_id}
                    </p>
                    
                    {user.phone && (
                      <p className="text-sm text-muted-foreground">
                        Telefon: {user.phone}
                      </p>
                    )}
                    
                    <p className="text-sm text-muted-foreground">
                      Oprettet: {new Date(user.created_at).toLocaleDateString('da-DK')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    {status.verifications.map((verification) => (
                      <div key={verification.type} className="flex items-center gap-2">
                        <div className="flex items-center gap-1 min-w-[80px]">
                          {verification.type === 'phone' && <Phone className="h-3 w-3" />}
                          {verification.type === 'mitid' && <Shield className="h-3 w-3" />}
                          {verification.type === 'payment' && <CreditCard className="h-3 w-3" />}
                          <span className="text-sm">{verification.label}</span>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant={verification.verified ? "default" : "outline"}
                            onClick={() => handleVerification(user.user_id, verification.type as any, true)}
                            disabled={verifyingUser === user.user_id || verification.verified}
                            className="h-7 px-2"
                          >
                            <CheckCircle className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant={!verification.verified ? "secondary" : "outline"}
                            onClick={() => handleVerification(user.user_id, verification.type as any, false)}
                            disabled={verifyingUser === user.user_id || !verification.verified}
                            className="h-7 px-2"
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm ? 'Ingen brugere matchede søgningen' : 'Ingen brugere fundet'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};