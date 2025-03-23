// app/terms/page.tsx

export const metadata = {
  title: "Termeni și condiții - Prodius Skool",
  description:
    "Citiți termenii și condițiile pentru utilizarea serviciilor Prodius Skool.",
};

export default function TermsOfServicePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-32">
      <h1 className="text-3xl font-bold mb-4">Termeni și condiții</h1>
      <p className="mb-6">
        Acești Termeni și condiții (&quot;Termeni&quot;) guvernează utilizarea
        site-ului și serviciilor Prodius Skool. Prin accesarea sau utilizarea
        platformei noastre, sunteți de acord să respectați acești Termeni.
      </p>

      <h2 className="text-xl font-semibold mb-2">1. Utilizarea Serviciului</h2>
      <p className="mb-4">
        Sunteți de acord să utilizați Prodius Skool în conformitate cu toate
        legile și reglementările aplicabile. Nu trebuie să utilizați serviciul
        în niciun mod care să cauzeze daune sau să încalce drepturile altora.
      </p>

      <h2 className="text-xl font-semibold mb-2">2. Înregistrarea Contului</h2>
      <p className="mb-4">
        Pentru a accesa anumite funcții, este posibil să fie necesar să creați
        un cont. Sunteți responsabil pentru menținerea confidențialității
        acreditărilor dvs. de autentificare și pentru toate activitățile care au
        loc sub contul dvs.
      </p>

      <h2 className="text-xl font-semibold mb-2">
        3. Proprietate Intelectuală
      </h2>
      <p className="mb-4">
        Tot conținutul furnizat pe Prodius Skool, inclusiv, dar fără a se limita
        la text, grafică, logo-uri și software, este proprietatea Prodius Skool
        sau a furnizorilor săi de conținut. Sunteți de acord să nu reproduceți
        sau să distribuiți acest conținut fără permisiunea explicită.
      </p>

      <h2 className="text-xl font-semibold mb-2">4. Conduita Utilizatorului</h2>
      <p className="mb-4">
        Sunteți de acord să nu încărcați sau să transmiteți niciun cod malițios,
        publicitate nesolicitată sau spam. Prodius Skool își rezervă dreptul de
        a elimina orice conținut care încalcă acești Termeni.
      </p>

      <h2 className="text-xl font-semibold mb-2">5. Limitarea Răspunderii</h2>
      <p className="mb-4">
        Prodius Skool este furnizat pe o bază &quot;așa cum este&quot;. Nu
        oferim nicio garanție, expresă sau implicită, și nu vom fi răspunzători
        pentru niciun fel de daune care rezultă din utilizarea serviciilor
        noastre.
      </p>

      <h2 className="text-xl font-semibold mb-2">
        6. Modificări ale Termenilor
      </h2>
      <p className="mb-4">
        Putem actualiza acești Termeni din când în când. Orice modificări vor fi
        postate pe această pagină, iar utilizarea continuă a serviciului după
        postarea oricăror modificări constituie acceptarea acelor modificări.
      </p>

      <h2 className="text-xl font-semibold mb-2">7. Informații de Contact</h2>
      <p className="mb-4">
        Dacă aveți întrebări sau nelămuriri cu privire la acești Termeni, vă
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
