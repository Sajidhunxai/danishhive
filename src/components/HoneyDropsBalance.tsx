import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Droplets, History } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface HoneyTransaction {
  id: string;
  amount: number;
  type: 'purchase' | 'bid' | 'refund';
  description: string;
  created_at: string;
  job_title?: string;
}

interface HoneyDropsBalanceProps {
  drops: number;
  onUpdate: () => void;
}

export const HoneyDropsBalance: React.FC<HoneyDropsBalanceProps> = ({ drops, onUpdate }) => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<HoneyTransaction[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!user || !showHistory) return;
    
    setLoading(true);
    try {
      // For now, create mock transaction data since the table doesn't exist yet
      const mockTransactions: HoneyTransaction[] = [
        {
          id: '1',
          amount: 25,
          type: 'purchase' as const,
          description: 'Køb af honningdråber pakke',
          created_at: new Date().toISOString(),
          job_title: undefined
        }
      ];

      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Error fetching honey transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showHistory) {
      fetchTransactions();
    }
  }, [showHistory, user]);

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'purchase':
        return '💳';
      case 'bid':
        return '🎯';
      case 'refund':
        return '↩️';
      default:
        return '📝';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'purchase':
      case 'refund':
        return 'text-green-600';
      case 'bid':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Badge variant="outline" className="flex items-center gap-2 px-3 py-1">
        <Droplets className="h-4 w-4 text-amber-500" />
        <span className="font-medium">{drops} honningdråber</span>
      </Badge>

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogTrigger asChild>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <History className="h-4 w-4" />
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Droplets className="h-5 w-5 text-amber-500" />
              Honningdråber Historik
            </DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Ingen transaktioner endnu
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dato</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Beløb</TableHead>
                  <TableHead>Beskrivelse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="text-sm">
                      {new Date(transaction.created_at).toLocaleDateString('da-DK', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{getTransactionIcon(transaction.type)}</span>
                        <span className="text-sm">
                          {transaction.type === 'purchase' ? 'Køb' : 
                           transaction.type === 'bid' ? 'Bud' : 
                           transaction.type === 'refund' ? 'Refusion' : transaction.type}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`font-medium ${getTransactionColor(transaction.type)}`}>
                        {transaction.type === 'bid' ? '-' : '+'}
                        {Math.abs(transaction.amount)} 
                        <Droplets className="h-3 w-3 inline ml-1 text-amber-500" />
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {transaction.job_title && (
                        <div className="font-medium">{transaction.job_title}</div>
                      )}
                      <div className="text-muted-foreground">{transaction.description}</div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};