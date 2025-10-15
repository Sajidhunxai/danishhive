import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BackButton } from '@/components/ui/back-button';
import { Shield, Mail, Phone, MapPin, Calendar } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <BackButton />
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Privatlivspolitik
          </h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Generelle oplysninger</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none space-y-6">
            <div>
              <p><strong>Sidst opdateret:</strong> {new Date().toLocaleDateString('da-DK')}</p>
              <p>
                Denne privatlivspolitik beskriver, hvordan Danish Hive ("vi", "os", "vores") 
                indsamler, bruger og beskytter dine personlige oplysninger, når du bruger vores platform.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Dataansvarlig
              </h3>
              <div className="bg-muted p-4 rounded-lg">
                <p><strong>Danish Hive ApS</strong></p>
                <p>CVR: [CVR-nummer]</p>
                <p>Adresse: [Adresse]</p>
                <p>Email: privacy@danishhive.dk</p>
                <p>Telefon: +45 XX XX XX XX</p>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Hvilke oplysninger indsamler vi?</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">Kontooplysninger</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Navn, email og telefonnummer</li>
                    <li>Adresse og bopælsoplysninger</li>
                    <li>Profilbillede og CV</li>
                    <li>Færdigheder og arbejdserfaring</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Betalingsoplysninger</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Bankkontooplysninger (IBAN/kontonummer)</li>
                    <li>MitID verifikationsdata</li>
                    <li>Betalingshistorik</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium">Platformsaktivitet</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    <li>Jobopslag og ansøgninger</li>
                    <li>Beskeder og kommunikation</li>
                    <li>Kontrakter og aftaler</li>
                    <li>Søge- og browseraktivitet</li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Hvorfor bruger vi dine oplysninger?</h3>
              <div className="space-y-3">
                <div className="border-l-4 border-primary pl-4">
                  <h4 className="font-medium">Kontraktopfyldelse</h4>
                  <p className="text-muted-foreground">
                    For at kunne levere vores tjenester, facilitere jobmatch og håndtere betalinger.
                  </p>
                </div>
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-medium">Legitime interesser</h4>
                  <p className="text-muted-foreground">
                    Forbedring af platformen, forebyggelse af misbrug og kundesupport.
                  </p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h4 className="font-medium">Samtykke</h4>
                  <p className="text-muted-foreground">
                    Markedsføring, nyhedsbreve og ikke-nødvendige cookies.
                  </p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h4 className="font-medium">Lovpligtige forpligtelser</h4>
                  <p className="text-muted-foreground">
                    Skattemæssige rapportering og anti-hvidvask kontrol.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Deling af oplysninger</h3>
              <p>Vi deler kun dine oplysninger i følgende tilfælde:</p>
              <ul className="list-disc list-inside space-y-2">
                <li>Med andre brugere som del af jobmatch-processen</li>
                <li>Med betalingsudbydere for at håndtere transaktioner</li>
                <li>Med myndigheder når det er lovpligtigt</li>
                <li>Med tjenesteudbydere der hjælper med at drive platformen</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Dine rettigheder</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Ret til indsigt</h4>
                  <p className="text-sm text-muted-foreground">Se hvilke data vi har om dig</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Ret til berigtigelse</h4>
                  <p className="text-sm text-muted-foreground">Ret fejl i dine data</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Ret til sletning</h4>
                  <p className="text-sm text-muted-foreground">Slet dine data</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium">Ret til dataportabilitet</h4>
                  <p className="text-sm text-muted-foreground">Download dine data</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Datasikkerhed</h3>
              <p>Vi implementerer passende tekniske og organisatoriske sikkerhedsforanstaltninger:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>End-to-end kryptering af følsomme data</li>
                <li>Regelmæssige sikkerhedsopdateringer</li>
                <li>Adgangskontrol og medarbejdertræning</li>
                <li>Regelmæssige sikkerhedsaudit</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3">Opbevaring af data</h3>
              <p>Vi opbevarer dine oplysninger kun så længe det er nødvendigt:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Kontooplysninger: Så længe din konto er aktiv</li>
                <li>Betalingsdata: 5 år (bogføringsloven)</li>
                <li>Kommunikation: 3 år efter sidste aktivitet</li>
                <li>Cookies: Maksimalt 13 måneder</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Kontakt os
              </h3>
              <p>
                Hvis du har spørgsmål til denne privatlivspolitik eller vil udøve dine rettigheder, 
                kan du kontakte os på:
              </p>
              <div className="bg-muted p-4 rounded-lg mt-3">
                <p><strong>Email:</strong> privacy@danishhive.dk</p>
                <p><strong>Telefon:</strong> +45 XX XX XX XX</p>
                <p><strong>Post:</strong> Danish Hive ApS, [Adresse]</p>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Du har altid ret til at klage til Datatilsynet, hvis du mener, 
                vi ikke overholder reglerne for databeskyttelse.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PrivacyPolicy;