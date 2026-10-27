import { useState, type CSSProperties, type ReactNode } from 'react';
import { tokenCss, type Tokens } from '../shared/model.js';

export function DSProvider({
  tokens,
  children,
}: {
  tokens: Tokens;
  children: ReactNode;
}) {
  return (
    <div className="ds" style={tokenCss(tokens) as CSSProperties}>
      {children}
    </div>
  );
}
export function Button({
  variant = 'primary',
  children,
  disabled = false,
  onClick,
}: {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      className={`ds-button ${variant}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
export function BookingCard() {
  const [booked, setBooked] = useState(false);
  return (
    <article className="ds-card">
      <div className="card-kicker">Verdict pour ton profil</div>
      <h3>Clair Obscur: Expedition 33</h3>
      <p>
        Jeu de rôle au tour par tour. Le mode Histoire élargit les fenêtres
        d’esquive et de parade.
      </p>
      <div className="card-meta">
        <span className="ds-badge">4 sur 5 besoins couverts</span>
        <span>Xbox Series</span>
      </div>
      <Button onClick={() => setBooked(!booked)}>
        {booked ? 'Jeu suivi' : 'Suivre ce jeu'}
      </Button>
      <span role="status" className="ds-feedback">
        {booked ? 'Suivi de démonstration, aucune donnée envoyée.' : ''}
      </span>
    </article>
  );
}
export function ExampleForm() {
  const [sent, setSent] = useState(false);
  return (
    <form
      className="ds-form"
      onSubmit={(e) => {
        e.preventDefault();
        setSent(true);
      }}
    >
      <label>
        Ton prénom
        <input placeholder="Léa" required onChange={() => setSent(false)} />
      </label>
      <label>
        Ton adresse e-mail
        <input
          type="email"
          placeholder="lea@example.com"
          required
          onChange={() => setSent(false)}
        />
      </label>
      <label>
        Champ désactivé
        <input placeholder="Non disponible" disabled />
      </label>
      <label className="ds-check">
        <input type="checkbox" required /> Je comprends que c’est une
        démonstration
      </label>
      <button className="ds-button primary" type="submit">
        Créer mon profil
      </button>
      <p role="status">
        {sent
          ? 'Profil de démonstration créé. Aucune donnée n’est envoyée.'
          : ''}
      </p>
    </form>
  );
}
export function Navigation() {
  const [tab, setTab] = useState('Un jeu');
  return (
    <nav aria-label="Navigation du scénario" className="ds-nav">
      {['Un jeu', 'Trouver', 'Mon profil'].map((t) => (
        <button
          key={t}
          aria-current={tab === t ? 'page' : undefined}
          onClick={() => setTab(t)}
        >
          {t}
        </button>
      ))}
      <p className="nav-context" aria-live="polite">
        {tab === 'Trouver'
          ? 'Les jeux jouables pour toi apparaîtront ici.'
          : tab === 'Mon profil'
            ? 'Ton profil de besoins, jamais ton diagnostic.'
            : 'Vérifie un jeu avant de l’acheter.'}
      </p>
    </nav>
  );
}
export function Catalogue({ tokens }: { tokens: Tokens }) {
  return (
    <DSProvider tokens={tokens}>
      <div className="catalogue">
        <section>
          <div className="section-label">01 / ACTIONS</div>
          <h3>Un langage commun.</h3>
          <p>Les mêmes tokens, du composant à l’écran.</p>
          <div className="button-row">
            <Button>Action principale</Button>
            <Button variant="secondary">Secondaire</Button>
            <Button variant="danger">Supprimer</Button>
            <Button disabled>Indisponible</Button>
          </div>
          <p className="ds-caption">
            Survolez, utilisez Tab et activez les boutons. Focus et états natifs
            inclus.
          </p>
        </section>
        <section>
          <div className="section-label">02 / CONTENUS</div>
          <BookingCard />
        </section>
        <section>
          <div className="section-label">03 / SAISIE</div>
          <ExampleForm />
        </section>
        <section>
          <div className="section-label">04 / NAVIGATION</div>
          <Navigation />
        </section>
      </div>
    </DSProvider>
  );
}
export function Scenario({
  tokens,
  scenario,
}: {
  tokens: Tokens;
  scenario: string;
}) {
  return (
    <DSProvider tokens={tokens}>
      <div className="scenario">
        <header className="scenario-head">
          <strong>Checkpoint</strong>
          <span className="ds-badge">Xbox Series</span>
        </header>
        <Navigation />
        <main>
          <div className="section-label">Avant d’acheter</div>
          <h1>
            Sache si tu
            <br />
            pourras y jouer.
          </h1>
          <p>Un verdict clair pour chaque jeu, à partir de tes besoins.</p>
          {scenario === 'form' ? (
            <div className="ds-card">
              <h2>Crée ton profil de besoins.</h2>
              <ExampleForm />
            </div>
          ) : (
            <div className="scenario-grid">
              <BookingCard />
              <article className="ds-card">
                <div className="card-kicker">Autre jeu</div>
                <h3>Baldur’s Gate 3</h3>
                <p>Tour par tour, jouable sans appuis rapides.</p>
                <Button variant="secondary">Voir la fiche</Button>
              </article>
            </div>
          )}
        </main>
        <footer>Checkpoint · design system du PFE</footer>
      </div>
    </DSProvider>
  );
}
