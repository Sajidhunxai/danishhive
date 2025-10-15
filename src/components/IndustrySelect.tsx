import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building } from 'lucide-react';

interface IndustrySelectProps {
  value: string;
  onValueChange: (value: string) => void;
}

const industries = [
  { value: 'technology', label: 'Teknologi & IT' },
  { value: 'finance', label: 'Finansielle tjenester' },
  { value: 'healthcare', label: 'Sundhedssektoren' },
  { value: 'manufacturing', label: 'Produktion & fremstilling' },
  { value: 'retail', label: 'Detail & e-handel' },
  { value: 'education', label: 'Uddannelse' },
  { value: 'consulting', label: 'Rådgivning' },
  { value: 'media', label: 'Medier & kommunikation' },
  { value: 'construction', label: 'Bygge & anlæg' },
  { value: 'transport', label: 'Transport & logistik' },
  { value: 'energy', label: 'Energi & miljø' },
  { value: 'agriculture', label: 'Landbrug & fødevarer' },
  { value: 'hospitality', label: 'Hotel & restaurant' },
  { value: 'real-estate', label: 'Ejendomme' },
  { value: 'legal', label: 'Juridiske tjenester' },
  { value: 'marketing', label: 'Marketing & reklame' },
  { value: 'design', label: 'Design & kreative tjenester' },
  { value: 'non-profit', label: 'Non-profit organisationer' },
  { value: 'government', label: 'Offentlig sektor' },
  { value: 'other', label: 'Andet' },
];

export const IndustrySelect: React.FC<IndustrySelectProps> = ({ value, onValueChange }) => {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Building className="h-4 w-4" />
        Branche *
      </Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Vælg din branche" />
        </SelectTrigger>
        <SelectContent>
          {industries.map(({ value: industryValue, label }) => (
            <SelectItem key={industryValue} value={industryValue}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};