import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/contexts/LanguageContext";
// Danish bank registration numbers mapping
const DANISH_BANKS: Record<string, string> = {
  "0092": "Arbejdernes Landsbank",
  "5301": "BankNordik",
  "7730": "Andelskassen",
  "9570": "Broager Sparekasse", 
  "9940": "Læsø Bank",
  "1551": "Coop Bank",
  "4183": "Danske Bank",
  "0216": "Danske Bank",
  "3001": "Danske Bank",
  "4000": "Nykredit Bank",
  "5196": "Nordea Bank", 
  "6070": "Jyske Bank",
  "7570": "Spar Nord Bank",
  "9330": "Sydbank",
  "8480": "Kredit Banken",
  "9860": "Ringkjøbing Landbobank",
  "9750": "Andelskassen",
  "7760": "Thy-Mors Sparekasse",
  "5432": "Merkur Andelskasse",
  "9311": "Folkesparekassen",
  "7620": "Vestjysk Bank",
  "8040": "Djurslands Bank",
  "5348": "Frørup Andelskasse"
};

type PaymentMethod = "danish_bank" | "iban" | "paypal";

interface BankAutocompleteProps {
  registrationNumber: string;
  accountNumber: string;
  bankName: string;
  accountHolderName: string;
  iban: string;
  paypalEmail: string;
  paymentMethod: PaymentMethod;
  onRegistrationNumberChange: (value: string) => void;
  onAccountNumberChange: (value: string) => void;
  onBankNameChange: (value: string) => void;
  onAccountHolderNameChange: (value: string) => void;
  onIbanChange: (value: string) => void;
  onPaypalEmailChange: (value: string) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
}

const BankAutocomplete: React.FC<BankAutocompleteProps> = ({
  registrationNumber,
  accountNumber,
  bankName,
  accountHolderName,
  iban,
  paypalEmail,
  paymentMethod,
  onRegistrationNumberChange,
  onAccountNumberChange,
  onBankNameChange,
  onAccountHolderNameChange,
  onIbanChange,
  onPaypalEmailChange,
  onPaymentMethodChange,
}) => {
  useEffect(() => {
    // Auto-fill bank name when registration number changes
    if (registrationNumber.length === 4) {
      const foundBank = DANISH_BANKS[registrationNumber];
      if (foundBank && foundBank !== bankName) {
        onBankNameChange(foundBank);
      }
    }
  }, [registrationNumber, bankName, onBankNameChange]);
  const { t } = useLanguage();
  const handleRegistrationNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 4); // Only numbers, max 4 digits
    onRegistrationNumberChange(value);
  };

  const handleAccountNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10); // Only numbers, max 10 digits
    onAccountNumberChange(value);
  };

  const handleIbanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 34);
    onIbanChange(value);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="payment_method">{t("payment.method")}</Label>
        <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
          <SelectTrigger>
            <SelectValue placeholder={t("payment.selectMethod")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="danish_bank">{t("payment.danishBank")}</SelectItem>
            <SelectItem value="iban">{t("payment.iban")}</SelectItem>
            <SelectItem value="paypal">{t("payment.paypal")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paymentMethod === "danish_bank" && (
        <>
          <div>
            <Label htmlFor="account_holder_name">{t("payment.accountHolder")}</Label>
            <Input
              id="account_holder_name"
              value={accountHolderName}
              onChange={(e) => onAccountHolderNameChange(e.target.value)}
              placeholder={t("payment.accountHolderPlaceholder")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="registration_number">{t("payment.registrationNumber")}</Label>
              <Input
                id="registration_number"
                value={registrationNumber}
                onChange={handleRegistrationNumberChange}
                placeholder={t("payment.registrationNumber")}
                maxLength={4}
                className={registrationNumber.length !== 4 && registrationNumber.length > 0 ? "border-destructive" : ""}
              />
              {registrationNumber.length > 0 && registrationNumber.length !== 4 && (
                <p className="text-sm text-destructive mt-1">{t("payment.registrationNumberError")}</p>
              )}
            </div>
            <div>
              <Label htmlFor="account_number">{t("payment.accountNumber")}</Label>
              <Input
                id="account_number"
                value={accountNumber}
                onChange={handleAccountNumberChange}
                placeholder={t("payment.accountNumber")}
                maxLength={10}
                className={accountNumber.length > 0 && (accountNumber.length < 6 || accountNumber.length > 10) ? "border-destructive" : ""}
              />
              {accountNumber.length > 0 && (accountNumber.length < 6 || accountNumber.length > 10) && (
                    <p className="text-sm text-destructive mt-1">{t("payment.accountNumberError")}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="bank_name">{t("payment.bankName")}</Label>
            <Input
              id="bank_name"
              value={bankName}
              onChange={(e) => onBankNameChange(e.target.value)}
              placeholder={t("payment.bankNamePlaceholder")}
              readOnly={DANISH_BANKS[registrationNumber] ? true : false}
              className={DANISH_BANKS[registrationNumber] ? "bg-muted" : ""}
            />
          </div>
        </>
      )}

      {paymentMethod === "iban" && (
        <>
          <div>
            <Label htmlFor="account_holder_name">{t("payment.accountHolder")}</Label>
            <Input
              id="account_holder_name"
              value={accountHolderName}
              onChange={(e) => onAccountHolderNameChange(e.target.value)}
              placeholder={t("payment.accountHolderPlaceholder")}
            />
          </div>
          <div>
            <Label htmlFor="iban">{t("payment.iban")}</Label>
            <Input
              id="iban"
              value={iban}
              onChange={handleIbanChange}
              placeholder={t("payment.ibanPlaceholder")}
              maxLength={34}
            />
          </div>
          <div>
            <Label htmlFor="bank_name">{t("payment.bankName")}</Label>
            <Input
              id="bank_name"
              value={bankName}
              onChange={(e) => onBankNameChange(e.target.value)}
              placeholder={t("payment.bankNamePlaceholder")}
            />
          </div>
        </>
      )}

      {paymentMethod === "paypal" && (
        <div>
          <Label htmlFor="paypal_email">{t("payment.paypalEmail")}</Label>
          <Input
            id="paypal_email"
            type="email"
            value={paypalEmail}
            onChange={(e) => onPaypalEmailChange(e.target.value)}
            placeholder={t("payment.paypalPlaceholder")}
          />
        </div>
      )}
    </div>
  );
};

export default BankAutocomplete;