import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CreditCard, Lock, Check } from 'lucide-react';

interface PaymentCardInfoProps {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardHolderName: string;
  onCardNumberChange: (value: string) => void;
  onExpiryDateChange: (value: string) => void;
  onCvvChange: (value: string) => void;
  onCardHolderNameChange: (value: string) => void;
}

export const PaymentCardInfo: React.FC<PaymentCardInfoProps> = ({
  cardNumber,
  expiryDate,
  cvv,
  cardHolderName,
  onCardNumberChange,
  onExpiryDateChange,
  onCvvChange,
  onCardHolderNameChange,
}) => {
  const [isVerified, setIsVerified] = useState(false);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const getCardType = (number: string) => {
    const num = number.replace(/\s/g, '');
    if (num.startsWith('4')) return 'Visa';
    if (num.startsWith('5') || num.startsWith('2')) return 'Mastercard';
    if (num.startsWith('3')) return 'American Express';
    return 'Ukendt';
  };

  const validateCard = () => {
    const cardNumClean = cardNumber.replace(/\s/g, '');
    if (cardNumClean.length >= 13 && expiryDate.length === 5 && cvv.length >= 3 && cardHolderName.length >= 2) {
      setIsVerified(true);
    }
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50">
      <Label className="text-base font-medium flex items-center gap-2">
        <Lock className="h-4 w-4 text-green-600" />
        Betalingskort Verificering *
        {isVerified && <Check className="h-4 w-4 text-green-600" />}
      </Label>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="card-number">Kortnummer</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="card-number"
              value={cardNumber}
              onChange={(e) => {
                const formatted = formatCardNumber(e.target.value);
                onCardNumberChange(formatted);
                validateCard();
              }}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="pl-10"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground">
              {cardNumber && getCardType(cardNumber)}
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <Label htmlFor="card-holder">Kortholders navn</Label>
          <Input
            id="card-holder"
            value={cardHolderName}
            onChange={(e) => {
              onCardHolderNameChange(e.target.value);
              validateCard();
            }}
            placeholder="Navn som det står på kortet"
          />
        </div>

        <div>
          <Label htmlFor="expiry">Udløbsdato</Label>
          <Input
            id="expiry"
            value={expiryDate}
            onChange={(e) => {
              const formatted = formatExpiryDate(e.target.value);
              onExpiryDateChange(formatted);
              validateCard();
            }}
            placeholder="MM/YY"
            maxLength={5}
          />
        </div>

        <div>
          <Label htmlFor="cvv">CVV</Label>
          <Input
            id="cvv"
            type="password"
            value={cvv}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '');
              onCvvChange(value);
              validateCard();
            }}
            placeholder="123"
            maxLength={4}
          />
        </div>
      </div>

      <div className="text-xs text-muted-foreground bg-white p-2 rounded border-l-4 border-blue-400">
        🔒 Dine kortoplysninger bruges kun til verificering og gemmes ikke permanent.
      </div>
    </div>
  );
};