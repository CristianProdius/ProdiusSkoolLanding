// app/privacy/page.tsx

export const metadata = {
  title: "Politica de Confidențialitate - Prodius Skool",
  description:
    "Află cum colectează și folosește Prodius Skool informațiile personale.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-32">
      <h1 className="text-3xl font-bold mb-4">Politica de Confidențialitate</h1>
      <p className="mb-6">
        La Prodius Skool, respectăm confidențialitatea dvs. și ne angajăm să
        protejăm datele dvs. personale. Această Politică de Confidențialitate
        explică cum colectăm, folosim și protejăm informațiile dvs. atunci când
        vizitați site-ul nostru sau utilizați serviciile noastre.
      </p>

      <h2 className="text-xl font-semibold mb-2">
        1. Informațiile pe care le colectăm
      </h2>
      <p className="mb-4">
        Putem colecta informații personale pe care ni le furnizați voluntar, cum
        ar fi numele, adresa de email și numărul de telefon. De asemenea,
        colectăm automat anumite informații tehnice, cum ar fi adresa IP, tipul
        de browser și informațiile despre dispozitiv.
      </p>

      <h2 className="text-xl font-semibold mb-2">
        2. Utilizarea informațiilor
      </h2>
      <p className="mb-4">
        Folosim informațiile dvs. pentru a furniza, menține și îmbunătăți
        serviciile noastre, pentru a răspunde la întrebările dvs. și pentru a vă
        trimite informații relevante despre Prodius Skool. De asemenea, putem
        folosi datele dvs. în scopuri analitice pentru a îmbunătăți experiența
        utilizatorului.
      </p>

      <h2 className="text-xl font-semibold mb-2">
        3. Partajarea informațiilor
      </h2>
      <p className="mb-4">
        Nu vindem și nu închiriem informațiile dvs. personale către terți. Putem
        partaja informațiile dvs. cu furnizori de servicii de încredere care ne
        ajută să operăm site-ul nostru sau să desfășurăm activități comerciale,
        cu condiția ca aceste părți să fie de acord să păstreze aceste
        informații confidențiale.
      </p>

      <h2 className="text-xl font-semibold mb-2">4. Cookie-uri</h2>
      <p className="mb-4">
        Folosim cookie-uri pentru a îmbunătăți performanța site-ului nostru și
        experiența dvs. Puteți dezactiva cookie-urile din setările browserului,
        dar acest lucru poate afecta funcționalitatea anumitor părți ale
        site-ului nostru.
      </p>

      <h2 className="text-xl font-semibold mb-2">5. Securitatea datelor</h2>
      <p className="mb-4">
        Luăm măsuri rezonabile pentru a proteja informațiile dvs. împotriva
        accesului sau dezvăluirii neautorizate. Cu toate acestea, nicio
        transmisie de date prin internet nu poate fi garantată ca fiind complet
        sigură.
      </p>

      <h2 className="text-xl font-semibold mb-2">
        6. Modificări ale acestei politici
      </h2>
      <p className="mb-4">
        Putem actualiza această Politică de Confidențialitate din când în când.
        Orice modificări vor fi postate pe această pagină, iar data revizuirii
        va fi actualizată în partea de sus.
      </p>

      <h2 className="text-xl font-semibold mb-2">7. Contactați-ne</h2>
      <p className="mb-4">
        Dacă aveți întrebări despre Politica noastră de Confidențialitate, vă
        rugăm să ne contactați la{" "}
        <a
          href="mailto:cristian@prodiusskool.com"
          className="text-blue-600 hover:underline"
        >
          cristian@prodiusskool.com
        </a>
        .
      </p>
    </main>
  );
}
