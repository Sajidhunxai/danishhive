import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { FileText, Scale, Shield, AlertTriangle } from 'lucide-react';
import { useLanguage } from "@/contexts/LanguageContext";
const TermsOfService = () => {
  const { t } = useLanguage();
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-8 w-8" />
            Servicevilkår
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generelle betingelser</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none space-y-6">
            <div>
              <p><strong>Gældende fra:</strong> {new Date().toLocaleDateString('da-DK')}</p>
              <p>
                Disse servicevilkår ("Vilkår") regulerer dit forhold til Danish Hive ApS ("Danish Hive", "vi", "os") 
                når du bruger vores freelance platform.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Acceptering af vilkår
              </h3>
              <p>
                Ved at oprette en konto og bruge Danish Hive accepterer du disse vilkår fuldt ud. 
                Hvis du ikke accepterer vilkårene, må du ikke bruge platformen.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Tjenestebeskrivelse</h3>
              <p>Danish Hive er en platform, der forbinder freelancere med kunder for forskellige arbejdsopgaver:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Jobopslag og ansøgningsprocesser</li>
                <li>Kommunikationsværktøjer</li>
                <li>Kontrakthåndtering og betalingsformidling</li>
                <li>Profil- og portfoliehåndtering</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Brugeraccounts</h3>
              <div className="space-y-3">
                <h4 className="font-medium">Krav til kontooprettelse:</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Du skal være mindst 18 år gammel</li>
                  <li>Alle oplysninger skal være korrekte og opdaterede</li>
                  <li>Du er ansvarlig for sikkerheden af din konto</li>
                  <li>Kun én konto per person er tilladt</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">For freelancere</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-medium">Forpligtelser</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Levere arbejde i overensstemmelse med aftaler</li>
                    <li>Kommunikere professionelt med kunder</li>
                    <li>Overholde deadlines og kvalitetsstandarter</li>
                    <li>Rapportere problemer til Danish Hive</li>
                  </ul>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium">Betaling</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Betaling sker månedligt (19. til 19.)</li>
                    <li>Danish Hive trækker 10% i provision</li>
                    <li>Du er selv ansvarlig for skat og moms</li>
                    <li>Udbetalinger kræver verificeret bankkonto</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">For kunder</h3>
              <div className="space-y-4">
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium">Forpligtelser</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Klare og præcise jobbeskrivelser</li>
                    <li>Rettidig betaling for udført arbejde</li>
                    <li>Konstruktiv kommunikation og feedback</li>
                    <li>Respektere freelanceres intellektuelle ejendomsret</li>
                  </ul>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium">Betaling</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Betaling skal ske gennem Danish Hive</li>
                    <li>Betalinger frigives ved arbejdsaflevering</li>
                    <li>Disputter håndteres gennem vores system</li>
                    <li>Kreditkort eller anden sikker betalingsmetode påkrævet</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Forbudt adfærd
              </h3>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <p className="font-medium mb-2">Følgende er ikke tilladt på platformen:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Diskriminerende eller krænkende adfærd</li>
                  <li>Omgåelse af betalingssystemet</li>
                  <li>Falske profiler eller oplysninger</li>
                  <li>Spam eller uønsket kommunikation</li>
                  <li>Krænkelse af andres intellektuelle ejendomsret</li>
                  <li>Ulovlig aktivitet af enhver art</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Intellektuel ejendomsret</h3>
              <div className="space-y-3">
                <p>
                  Freelancere bevarer rettigheder til deres originale arbejde, medmindre andet aftales skriftligt. 
                  Kunder får brugsret til det bestilte arbejde efter fuld betaling.
                </p>
                <p>
                  Danish Hive bevarer ret til at bruge anonymiserede eksempler af arbejde til 
                  markedsføring og platformforbedring.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Disputløsning</h3>
              <div className="space-y-3">
                <p>Ved uenigheder mellem parter:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>Forsøg først direkte forhandling</li>
                  <li>Kontakt Danish Hive's support</li>
                  <li>Mediation gennem vores system</li>
                  <li>Som sidste udvej: danske domstole (København)</li>
                </ol>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Ansvarsbegrænsning</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  <strong>Vigtig:</strong> Danish Hive fungerer som en platform og er ikke part i kontrakterne 
                  mellem freelancere og kunder. Vi påtager os ikke ansvar for:
                </p>
                <ul className="list-disc list-inside text-sm mt-2 space-y-1">
                  <li>Kvaliteten af udført arbejde</li>
                  <li>Overholdelse af deadlines</li>
                  <li>Direkte eller indirekte tab</li>
                  <li>Tredjepartstjenester</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Ændringer af vilkår</h3>
              <p>
                Vi kan opdatere disse vilkår med 30 dages varsel. Fortsættelse af brugen efter 
                ændringerne træder i kraft, betyder accept af de nye vilkår.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Kontaktoplysninger</h3>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>{t("privacy.company")}</strong></p>
                <p>CVR: [CVR-nummer]</p>
                <p>Email: support@danishhive.dk</p>
                <p>Telefon: +45 XX XX XX XX</p>
                <p>Adresse: [Adresse]</p>
              </div>
            </div>

            <div className="border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Disse vilkår er underlagt dansk ret og eventuelle tvister skal afgøres ved danske domstole.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;