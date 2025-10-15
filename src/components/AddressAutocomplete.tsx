import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MapPin, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface Address {
  tekst: string;
  adresse: {
    vejnavn: string;
    husnr: string;
    postnr: string;
    postnrnavn: string;
  };
}

interface AddressAutocompleteProps {
  value?: string;
  onAddressSelect?: (address: {
    address: string;
    city: string;
    postal_code: string;
    location: string;
  }) => void;
  placeholder?: string;
  className?: string;
}

const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  value = "",
  onAddressSelect,
  placeholder = "Søg adresse...",
  className
}) => {
  const [searchQuery, setSearchQuery] = useState(value);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setSearchQuery(value);
  }, [value]);

  const searchAddresses = async (query: string) => {
    if (query.length < 3) {
      setAddresses([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `https://api.dataforsyningen.dk/adresser/autocomplete?q=${encodeURIComponent(query)}&per_side=10`
      );
      
      if (response.ok) {
        const data = await response.json();
        setAddresses(data);
      } else {
        console.error('Error fetching addresses:', response.status);
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (newValue: string) => {
    setSearchQuery(newValue);
    setIsOpen(newValue.length >= 3);

    // Debounce the search
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchAddresses(newValue);
    }, 300);
  };

  const handleAddressSelect = (address: Address) => {
    const fullAddress = `${address.adresse.vejnavn} ${address.adresse.husnr}`;
    const city = address.adresse.postnrnavn;
    const postal_code = address.adresse.postnr;
    const location = `${city}, Danmark`;

    setSearchQuery(address.tekst);
    setIsOpen(false);

    if (onAddressSelect) {
      onAddressSelect({
        address: fullAddress,
        city: city,
        postal_code: postal_code,
        location: location
      });
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="address">Adresse</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="address"
              className={cn("pl-10", className)}
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              autoComplete="off"
            />
            {isLoading && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </div>
        </PopoverTrigger>
        
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandList>
              <CommandEmpty>
                {searchQuery.length < 3 ? (
                  <div className="p-4 text-sm text-muted-foreground">
                    Indtast mindst 3 tegn for at søge
                  </div>
                ) : (
                  <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Ingen adresser fundet
                  </div>
                )}
              </CommandEmpty>
              <CommandGroup>
                {addresses.map((address, index) => (
                  <CommandItem
                    key={index}
                    value={address.tekst}
                    onSelect={() => handleAddressSelect(address)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <span className="text-sm">{address.tekst}</span>
                      <span className="text-xs text-muted-foreground">
                        {address.adresse.postnr} {address.adresse.postnrnavn}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default AddressAutocomplete;