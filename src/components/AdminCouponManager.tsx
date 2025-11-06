import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/services/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Ticket, Plus, Eye, Users, Droplets, Percent, Calendar, Copy, Trash2 } from 'lucide-react';

interface CouponCode {
  id: string;
  code: string;
  type: 'freelancer' | 'client';
  benefit_type: 'honey_drops' | 'fee_reduction';
  honey_drops_amount?: number;
  fee_rate?: number;
  max_uses: number;
  current_uses: number;
  expires_at?: string;
  created_at: string;
  is_active: boolean;
}

interface CouponUsage {
  id: string;
  user_id: string;
  coupon_code: string;
  used_at: string;
  user_profile: {
    full_name: string;
    email?: string;
  };
}

export const AdminCouponManager: React.FC = () => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [coupons, setCoupons] = useState<CouponCode[]>([]);
  const [couponUsages, setCouponUsages] = useState<CouponUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  // Form state for generating coupons
  const [generateForm, setGenerateForm] = useState({
    quantity: 1,
    type: 'freelancer' as 'freelancer' | 'client',
    benefit_type: 'honey_drops' as 'honey_drops' | 'fee_reduction',
    honey_drops_amount: 120,
    fee_rate: 0.08,
    max_uses_per_code: 1,
    expires_in_days: 30,
    code_prefix: ''
  });

  useEffect(() => {
    fetchCoupons();
    fetchCouponUsages();
  }, []);

  const fetchCoupons = async () => {
    try {
      const data = await api.admin.getAllCoupons();
      // Map backend coupons to expected format
      const mappedCoupons = data.map((coupon: any) => ({
        id: coupon.id,
        code: coupon.code,
        type: 'freelancer', // Default type
        benefit_type: 'fee_reduction', // Default benefit type
        fee_rate: Number(coupon.discount),
        max_uses: coupon.maxUses || 0,
        current_uses: coupon.usedCount || 0,
        expires_at: coupon.expiresAt,
        created_at: coupon.createdAt,
        is_active: coupon.isActive,
      }));
      setCoupons(mappedCoupons);
    } catch (error: any) {
      console.error('Error fetching coupons:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke hente kuponkoder",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCouponUsages = async () => {
    try {
      // TODO: When backend has coupon usage endpoint, use it
      // For now, return empty array
      setCouponUsages([]);
    } catch (error: any) {
      console.error('Error fetching coupon usage:', error);
    }
  };

  const generateCoupons = async () => {
    setGenerating(true);
    try {
      // Generate coupons using backend API
      for (let i = 0; i < generateForm.quantity; i++) {
        await api.admin.createCoupon({
          code: generateForm.code_prefix 
            ? `${generateForm.code_prefix}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
            : `COUPON-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          discount: generateForm.benefit_type === 'fee_reduction' 
            ? generateForm.fee_rate 
            : generateForm.honey_drops_amount || 0,
          maxUses: generateForm.max_uses_per_code,
          expiresAt: generateForm.expires_in_days 
            ? new Date(Date.now() + generateForm.expires_in_days * 24 * 60 * 60 * 1000).toISOString()
            : null,
        });
      }

      toast({
        title: "Kuponkoder genereret!",
        description: `${generateForm.quantity} kuponkoder er blevet oprettet`,
      });

      setShowGenerateDialog(false);
      fetchCoupons();
    } catch (error: any) {
      console.error('Error generating coupons:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke generere kuponkoder",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const toggleCouponStatus = async (couponId: string, isActive: boolean) => {
    try {
      await api.admin.updateCoupon(couponId, {
        isActive: !isActive
      });

      toast({
        title: "Status opdateret",
        description: `Kupon ${!isActive ? 'aktiveret' : 'deaktiveret'}`,
      });

      fetchCoupons();
    } catch (error: any) {
      console.error('Error toggling coupon:', error);
      toast({
        title: "Fejl",
        description: error.message || "Kunne ikke opdatere kupon status",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Kopieret!",
      description: "Kuponkode kopieret til udklipsholder",
    });
  };

  const formatCouponBenefit = (coupon: CouponCode) => {
    if (coupon.benefit_type === 'honey_drops') {
      return `${coupon.honey_drops_amount} honningdråber`;
    } else {
      return `${(coupon.fee_rate! * 100).toFixed(0)}% gebyr`;
    }
  };

  const getUsageStats = () => {
    const activeFreelancerCoupons = coupons.filter(c => c.type === 'freelancer' && c.is_active).length;
    const activeClientCoupons = coupons.filter(c => c.type === 'client' && c.is_active).length;
    const totalUsages = coupons.reduce((sum, c) => sum + c.current_uses, 0);
    
    return { activeFreelancerCoupons, activeClientCoupons, totalUsages };
  };

  const stats = getUsageStats();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('loading.coupons')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            Kuponkode Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.activeFreelancerCoupons}</div>
              <p className="text-sm text-muted-foreground">Aktive Freelancer Kuponer</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.activeClientCoupons}</div>
              <p className="text-sm text-muted-foreground">Aktive Klient Kuponer</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalUsages}</div>
              <p className="text-sm text-muted-foreground">Total Anvendelser</p>
            </div>
            <div className="flex justify-center">
              <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Generer Kuponer
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Generer Nye Kuponkoder</DialogTitle>
                    <DialogDescription>
                      Opret nye kuponkoder til freelancers eller klienter
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Antal</Label>
                        <Input
                          type="number"
                          min="1"
                          max="100"
                          value={generateForm.quantity}
                          onChange={(e) => setGenerateForm(prev => ({ 
                            ...prev, 
                            quantity: parseInt(e.target.value) || 1 
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select 
                          value={generateForm.type} 
                          onValueChange={(value: 'freelancer' | 'client') => 
                            setGenerateForm(prev => ({ ...prev, type: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="freelancer">Freelancer</SelectItem>
                            <SelectItem value="client">Klient</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Fordel Type</Label>
                      <Select 
                        value={generateForm.benefit_type} 
                        onValueChange={(value: 'honey_drops' | 'fee_reduction') => 
                          setGenerateForm(prev => ({ ...prev, benefit_type: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="honey_drops">Honningdråber</SelectItem>
                          <SelectItem value="fee_reduction">Gebyr Reduktion</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {generateForm.benefit_type === 'honey_drops' ? (
                      <div>
                        <Label>Antal Honningdråber</Label>
                        <Input
                          type="number"
                          min="1"
                          value={generateForm.honey_drops_amount}
                          onChange={(e) => setGenerateForm(prev => ({ 
                            ...prev, 
                            honey_drops_amount: parseInt(e.target.value) || 120 
                          }))}
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>Nyt Gebyr (%)</Label>
                        <Input
                          type="number"
                          min="0"
                          max="15"
                          step="0.1"
                          value={generateForm.fee_rate * 100}
                          onChange={(e) => setGenerateForm(prev => ({ 
                            ...prev, 
                            fee_rate: (parseFloat(e.target.value) || 8) / 100 
                          }))}
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Max anvendelser pr. kupon</Label>
                        <Input
                          type="number"
                          min="1"
                          value={generateForm.max_uses_per_code}
                          onChange={(e) => setGenerateForm(prev => ({ 
                            ...prev, 
                            max_uses_per_code: parseInt(e.target.value) || 1 
                          }))}
                        />
                      </div>
                      <div>
                        <Label>Udløber om (dage)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={generateForm.expires_in_days}
                          onChange={(e) => setGenerateForm(prev => ({ 
                            ...prev, 
                            expires_in_days: parseInt(e.target.value) || 30 
                          }))}
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Kode Præfix (valgfrit)</Label>
                      <Input
                        placeholder="f.eks. SAVE"
                        value={generateForm.code_prefix}
                        onChange={(e) => setGenerateForm(prev => ({ 
                          ...prev, 
                          code_prefix: e.target.value.toUpperCase() 
                        }))}
                      />
                    </div>

                    <Button 
                      onClick={generateCoupons} 
                      disabled={generating}
                      className="w-full"
                    >
                      {generating ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Generer {generateForm.quantity} Kuponer
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Coupon Tables */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Aktive Kuponer</TabsTrigger>
          <TabsTrigger value="all">Alle Kuponer</TabsTrigger>
          <TabsTrigger value="usage">Anvendelser</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Aktive Kuponkoder</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Fordel</TableHead>
                    <TableHead>Anvendelser</TableHead>
                    <TableHead>Udløber</TableHead>
                    <TableHead>Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.filter(c => c.is_active).map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono">
                        <div className="flex items-center gap-2">
                          {coupon.code}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(coupon.code)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.type === 'freelancer' ? 'default' : 'secondary'}>
                          {coupon.type === 'freelancer' ? (
                            <><Users className="h-3 w-3 mr-1" />Freelancer</>
                          ) : (
                            <><Users className="h-3 w-3 mr-1" />Klient</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {coupon.benefit_type === 'honey_drops' ? (
                            <><Droplets className="h-3 w-3 text-amber-500" />{formatCouponBenefit(coupon)}</>
                          ) : (
                            <><Percent className="h-3 w-3 text-green-500" />{formatCouponBenefit(coupon)}</>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {coupon.current_uses} / {coupon.max_uses}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {coupon.expires_at ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {new Date(coupon.expires_at).toLocaleDateString('da-DK')}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Ingen udløb</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                        >
                          Deaktiver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alle Kuponkoder</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Fordel</TableHead>
                    <TableHead>Anvendelser</TableHead>
                    <TableHead>Oprettet</TableHead>
                    <TableHead>Handlinger</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coupons.map((coupon) => (
                    <TableRow key={coupon.id}>
                      <TableCell className="font-mono">{coupon.code}</TableCell>
                      <TableCell>
                        <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                          {coupon.is_active ? 'Aktiv' : 'Inaktiv'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={coupon.type === 'freelancer' ? 'default' : 'secondary'}>
                          {coupon.type === 'freelancer' ? 'Freelancer' : 'Klient'}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCouponBenefit(coupon)}</TableCell>
                      <TableCell>{coupon.current_uses} / {coupon.max_uses}</TableCell>
                      <TableCell>
                        {new Date(coupon.created_at).toLocaleDateString('da-DK')}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleCouponStatus(coupon.id, coupon.is_active)}
                        >
                          {coupon.is_active ? 'Deaktiver' : 'Aktiver'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Kupon Anvendelser</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bruger</TableHead>
                    <TableHead>Kuponkode</TableHead>
                    <TableHead>Anvendt Dato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {couponUsages.map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell>{usage.user_profile?.full_name || 'Ukendt bruger'}</TableCell>
                      <TableCell className="font-mono">{usage.coupon_code}</TableCell>
                      <TableCell>
                        {new Date(usage.used_at).toLocaleDateString('da-DK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};